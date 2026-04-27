"""
Quick Firebase connection test
"""
import os
from dotenv import load_dotenv

load_dotenv()

import firebase_admin
from firebase_admin import credentials, firestore

def test_connection():
    print("Testing Firebase connection...")

    # Check environment variables
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    project_id = os.getenv("FIREBASE_PROJECT_ID")

    print(f"Credentials path: {creds_path}")
    print(f"Project ID: {project_id}")

    # Check if credentials file exists
    if not os.path.exists(creds_path):
        print(f"ERROR: Credentials file not found at {creds_path}")
        return False

    print("Credentials file found!")

    # Initialize Firebase
    try:
        cred = credentials.Certificate(creds_path)
        firebase_admin.initialize_app(cred, {
            'projectId': project_id
        })
        print("Firebase app initialized successfully!")
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return False

    # Test Firestore connection
    try:
        db = firestore.client()
        print("Firestore client created!")

        # Try to read from books collection (should be empty but connection should work)
        books_ref = db.collection('books')
        docs = books_ref.limit(1).stream()
        doc_count = sum(1 for _ in docs)
        print(f"Successfully queried Firestore! Found {doc_count} books in database.")

        return True
    except Exception as e:
        print(f"Error connecting to Firestore: {e}")
        return False

if __name__ == "__main__":
    success = test_connection()
    if success:
        print("\n✓ Firebase connection test PASSED!")
    else:
        print("\n✗ Firebase connection test FAILED!")
