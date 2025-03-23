import whisper
import os

"""
This project is used to transcribe audio files to text using the OpenAI Whisper model.
It uses a virtual environment with the requirements installed there.
It is intended to be used to transcribe audio files and then convert the .txt files to a .docx file.
From here, a LLM will be used to edit the .docx file to make it more readable.
"""

# STEP 1: Transcribe audio file to text; pulled from https://github.com/openai/whisper/blob/main/README.md

model = whisper.load_model("turbo") #load whisper model
recordings = "./Recordings" #path to audio file
recording_text_files = "./Recording_text_files" #path to save text files

recording_titles = os.listdir(recordings) #list of audio files

for item in recording_titles:
    story_path = os.path.join(recordings, item)
    result = model.transcribe(story_path)
    
    #create a file to save the text
    os.makedirs(f"recording_text_files/{item}", exist_ok=True)
    
    #write the text to a .txt file
    with open(f"recording_text_files/{item}.txt", "w") as f:
        f.write(result["text"])
        

#STEP 2: Take that text and write it to a .txt file
