import re

import spacy
from spacy.language import Language
from spacy.tokens import Span
from spacy.util import filter_spans

from .patterns import TRACE_PHRASES, build_patterns

E_NUMBER_RE = re.compile(r"\bE[\s-]?(\d{3,4}[a-z]?)\b", re.IGNORECASE)

Span.set_extension("is_trace", default=False, force=True)

_nlp = None


@Language.component("e_number_detector")
def e_number_detector(doc):
    spans = []
    for m in E_NUMBER_RE.finditer(doc.text):
        span = doc.char_span(m.start(), m.end(), label="E_NUMBER",
                             alignment_mode="expand")
        if span is not None:
            spans.append(span)
    doc.ents = filter_spans(list(doc.ents) + spans)  # keep allergens, add E-numbers
    return doc


@Language.component("trace_flagger")
def trace_flagger(doc):
    text = doc.text
    for ent in doc.ents:
        if ent.label_ != "ALLERGEN":
            continue
        before = text[max(0, ent.start_char - 80):ent.start_char].lower()
        before = before.split(".")[-1]  # same sentence only
        ent._.is_trace = any(p in before for p in TRACE_PHRASES)
    return doc


def get_nlp():
    """Build the pipeline once and reuse it."""
    global _nlp
    if _nlp is None:
        nlp = spacy.load("en_core_web_sm", exclude=["ner", "parser", "lemmatizer"])
        ruler = nlp.add_pipe("entity_ruler", config={"phrase_matcher_attr": "LOWER"})
        ruler.add_patterns(build_patterns())
        nlp.add_pipe("e_number_detector", after="entity_ruler")
        nlp.add_pipe("trace_flagger", last=True)
        _nlp = nlp
    return _nlp