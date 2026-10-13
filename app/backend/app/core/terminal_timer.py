import sys
import time
from datetime import datetime

# Ensure utf-8 output on Windows consoles if supported
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


# ANSI Color Codes for terminal formatting
class TermColors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    UNDERLINE = "\033[4m"

    # Foreground colors
    BLACK = "\033[30m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"


def _now_str() -> str:
    return datetime.now().strftime("%H:%M:%S")


def log_banner(title: str, subtitle: str = ""):
    """Prints a styled header banner for an incoming scan request."""
    now = _now_str()
    print(f"\n{TermColors.CYAN}{TermColors.BOLD}{'=' * 68}{TermColors.RESET}", flush=True)
    print(f"{TermColors.CYAN}{TermColors.BOLD} [SCAN PIPELINE] {title} {TermColors.DIM}({now}){TermColors.RESET}", flush=True)
    if subtitle:
        print(f" {TermColors.WHITE}{subtitle}{TermColors.RESET}", flush=True)
    print(f"{TermColors.CYAN}{'-' * 68}{TermColors.RESET}", flush=True)


def log_step_start(step_name: str, description: str = ""):
    """Logs the immediate real-time start of a pipeline step (OCR, NER, etc.)."""
    now = _now_str()
    desc_str = f" - {description}" if description else ""
    print(
        f"  {TermColors.YELLOW}[>>] [{step_name}] [STARTED at {now}]{TermColors.RESET}{TermColors.WHITE}{desc_str}{TermColors.RESET}",
        flush=True,
    )


def log_step_done(step_name: str, elapsed_seconds: float, details: str = ""):
    """Logs the completion of a pipeline step with exact duration."""
    time_fmt = f"{elapsed_seconds:.2f}s" if elapsed_seconds >= 1.0 else f"{elapsed_seconds * 1000:.0f}ms"
    detail_str = f" | {details}" if details else ""
    print(
        f"  {TermColors.GREEN}[OK] [{step_name}] [FINISHED in {time_fmt}]{TermColors.RESET}{TermColors.DIM}{detail_str}{TermColors.RESET}",
        flush=True,
    )


def log_step_fail(step_name: str, elapsed_seconds: float, error_msg: str = ""):
    """Logs step failure with elapsed time."""
    time_fmt = f"{elapsed_seconds:.2f}s" if elapsed_seconds >= 1.0 else f"{elapsed_seconds * 1000:.0f}ms"
    print(
        f"  {TermColors.RED}[X] [{step_name}] [FAILED after {time_fmt}]: {error_msg}{TermColors.RESET}",
        flush=True,
    )


def log_pipeline_finish(total_seconds: float, summary: str = ""):
    """Prints a styled summary footer showing total runtime."""
    time_fmt = f"{total_seconds:.2f}s" if total_seconds >= 1.0 else f"{total_seconds * 1000:.0f}ms"
    print(f"{TermColors.CYAN}{'-' * 68}{TermColors.RESET}", flush=True)
    print(
        f"  {TermColors.BOLD}{TermColors.GREEN}[+] [PIPELINE COMPLETED]{TermColors.RESET} {TermColors.BOLD}Total Time: {time_fmt}{TermColors.RESET}",
        flush=True,
    )
    if summary:
        print(f"  {TermColors.WHITE}Summary: {summary}{TermColors.RESET}", flush=True)
    print(f"{TermColors.CYAN}{'=' * 68}{TermColors.RESET}\n", flush=True)


class StepTimer:
    """
    Context manager for measuring and logging execution time in real time.

    Usage:
        with StepTimer("OCR", "Extracting text from image") as timer:
            result = do_ocr()
            timer.set_details(f"Found {len(result)} lines")
    """

    def __init__(self, step_name: str, description: str = ""):
        self.step_name = step_name
        self.description = description
        self.details = ""
        self.start_time = 0.0
        self.elapsed = 0.0

    def set_details(self, details: str):
        self.details = details

    def __enter__(self):
        log_step_start(self.step_name, self.description)
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.elapsed = time.perf_counter() - self.start_time
        if exc_type is not None:
            log_step_fail(self.step_name, self.elapsed, str(exc_val))
        else:
            log_step_done(self.step_name, self.elapsed, self.details)
        return False
