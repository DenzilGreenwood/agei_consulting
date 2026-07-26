import docx
import sys

def extract_text_from_docx(file_path):
    try:
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return '\n'.join(full_text)
    except Exception as e:
        return str(e)

if __name__ == '__main__':
    file_path = sys.argv[1]
    text = extract_text_from_docx(file_path)
    with open('extracted_doc.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Done")
