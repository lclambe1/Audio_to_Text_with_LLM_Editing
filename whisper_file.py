import whisper
import os
from tqdm import tqdm

import ollama
from ollama import chat
from ollama import ChatResponse

import subprocess
import time

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

def correct_grammar(result):
    response: ChatResponse = chat(model='llama3.2', messages=[
    {
        'role': 'user',
        'content': f'Please correct the grammar in the {result} text and reword so that it flows better as a story to captivate and to engage its reader.',
    },
    ])
    #print(response['message']['content'])
    # or access fields directly from the response object
    print(response.message.content)


if __name__ == "__main__":

    model = whisper.load_model("turbo") #load whisper model
    recordings = "./Recordings" #path to audio file
    recording_text_files = "./Recording_text_files" #path to save text files

    recording_titles = os.listdir(recordings) #list of audio files
    
    # NOTE: The Llama model is not available in the virtual environment and must be downloaded. 
    # Mistral (or whatever other model you choose) must be downloaded as well.
    # Please see: https://github.com/ollama/ollama-python/blob/main/README.md for more information.
    
    # in Windows I had to run the following commands in the Powershell to run/install the Llama model:
    # ollama serve
    # ollama pull mistral
    # ollama pull llama3.2
    
    # Load the Llama model
    ollama_model = 'mistral'

    try:
        ollama.chat(ollama_model)
        print('Model is available and running.')
    except ollama.ResponseError as e:
        print('Error:', e.error)
        if e.status_code == 404:
            ollama.pull(ollama_model)


    for item in tqdm(recording_titles):
        story_path = os.path.join(recordings, item)
        
        # STEP 1: transcribe the audio
        result = transcribe_audio(model, story_path)
        print("Congratulations! Your audio has been transcribed.")
        
        # STEP 2: write the text to a .txt file
        write_text_to_file(item, recording_text_files)
        print("Your text has been written to a .txt file.")
        
        # STEP 3: correct the grammar
        correct_grammar(result)