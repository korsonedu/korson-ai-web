import os
import django
import sys
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_system.settings')
django.setup()

from quizzes.models import Question, KnowledgePoint
from django.conf import settings

# Directory containing source files
SOURCE_DIR = os.path.join(settings.BASE_DIR, 'uploads', 'exercises_source')

def create_exercises():
    print(f"Scanning for exercise files in: {SOURCE_DIR}...")
    
    if not os.path.exists(SOURCE_DIR):
        print(f"Directory not found. Please create it and upload files.")
        return

    files = [f for f in os.listdir(SOURCE_DIR) if f.endswith('.json') or f.endswith('.txt')]
    
    if not files:
        print("No files found. Please upload .json or .txt files to the directory.")
        return

    count = 0
    for filename in files:
        file_path = os.path.join(SOURCE_DIR, filename)
        print(f"Processing {filename}...")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                # TODO: Implement specific parsing logic here based on file format
                # For now, assuming JSON format for demonstration
                try:
                    data = json.load(f)
                    # Example structure: [{"text": "...", "answer": "...", "type": "objective", ...}]
                    if isinstance(data, list):
                        for item in data:
                            Question.objects.get_or_create(
                                text=item.get('text'),
                                defaults={
                                    'q_type': item.get('type', 'objective'),
                                    'correct_answer': item.get('answer'),
                                    'options': item.get('options', {}),
                                    'difficulty': item.get('difficulty', 1000)
                                }
                            )
                            count += 1
                except json.JSONDecodeError:
                    print(f"Skipping {filename}: Invalid JSON")
                    # If not JSON, maybe implement text parsing logic here
                    pass
                    
        except Exception as e:
            print(f"Error processing {filename}: {e}")

    print(f"
Mission Complete. Created {count} questions.")

if __name__ == "__main__":
    create_exercises()
