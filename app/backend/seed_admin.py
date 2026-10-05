"""
SafeLabel AI - Admin Seed Script
Creates or updates the default admin user with role='admin' in PostgreSQL.
"""
import sys
import os

# Add parent directory to path so app package can be imported
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import seed_admin_user, find_user_by_email

if __name__ == "__main__":
    print("Seeding default admin user into SafeLabel AI PostgreSQL database...")
    admin = seed_admin_user()
    print(f"Success! Admin user: {admin['email']} (role: {admin['role']}, status: {admin['status']})")
