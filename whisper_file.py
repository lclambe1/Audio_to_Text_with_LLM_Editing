import whisper
import os
from tqdm import tqdm

"""
This project is used to transcribe audio files to text using the OpenAI Whisper model.
It uses a virtual environment with the requirements installed there.
It is intended to be used to transcribe audio files and then convert the .txt files to a .docx file.
From here, a LLM will be used to edit the .docx file to make it more readable.
"""

def transcribe_audio(model, recording_path):
    """_summary_

    Args:
        model: The Whisper model to use

    Returns:
        str: The transcribed audio text as a string 
    """    
    result = model.transcribe(recording_path)
    return result

def write_text_to_file(item, recording_text_files):
    """_summary_

    Args:
        text: The text to write to the file
        recording_text_files: The path to the file to write to
        
    Returns:
        None
        Saves a .txt file of the transcribed audio
    """    
    name = item.split(".")[0]
    with open(f"{recording_text_files}/{name}.txt", "w") as f:
        f.write(result["text"])



if __name__ == "__main__":

    model = whisper.load_model("turbo") #load whisper model
    recordings = "./Recordings" #path to audio file
    recording_text_files = "./Recording_text_files" #path to save text files

    recording_titles = os.listdir(recordings) #list of audio files

    for item in tqdm(recording_titles):
        story_path = os.path.join(recordings, item)
        
        # STEP 1: transcribe the audio
        result = transcribe_audio(model, story_path)
        
        # STEP 2: write the text to a .txt file
        write_text_to_file(item, recording_text_files)
        
        # STEP 3: convert the .txt file to a .docx file