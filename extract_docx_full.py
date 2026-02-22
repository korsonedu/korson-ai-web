import docx
import os

doc_path = "backend/uploads/exercises_source/决战计算180题底稿.docx"
doc = docx.Document(doc_path)

output_path = "backend/uploads/exercises_source/extracted_text_full.txt"
with open(output_path, "w", encoding="utf-8") as f:
    for para in doc.paragraphs:
        line = para.text + "
"
        f.write(line)
