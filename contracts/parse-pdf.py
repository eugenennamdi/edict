import PyPDF2

with open('/Users/apple/.gemini/antigravity/brain/0a2a1a97-5e60-4f9e-9e83-41fe6046ef5c/.tempmediaStorage/media_1785989046946.pdf', 'rb') as file:
    reader = PyPDF2.PdfReader(file)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    print(text)
