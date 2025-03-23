import whisper
import os
from tqdm import tqdm

"""
This project is used to transcribe audio files to text using the OpenAI Whisper model.
It uses a virtual environment with the requirements installed there.
It is intended to be used to transcribe audio files and then convert the .txt files to a .docx file.
From here, a LLM will be used to edit the .docx file to make it more readable.
"""

model = whisper.load_model("turbo") #load whisper model
recordings = "./Recordings" #path to audio file
recording_text_files = "./Recording_text_files" #path to save text files

recording_titles = os.listdir(recordings) #list of audio files


for item in tqdm(recording_titles):
    story_path = os.path.join(recordings, item)
    
    # STEP 1: Transcribe audio file to text; pulled from https://github.com/openai/whisper/blob/main/README.md
    result = model.transcribe(story_path)
    
    # STEP 2: write the text to a .txt file
    name = item.split(".")[0]
    with open(f"recording_text_files/{name}.txt", "w") as f:
        f.write(result["text"])
    

#STEP 2: Take that text and write it to a .txt file
