from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
import cv2
import face_recognition

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "AI Service Running"}

@app.post("/get-encoding")
async def get_encoding(file: UploadFile = File(...)):
    try:
        # Read image file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
             raise HTTPException(status_code=400, detail="Invalid image file")

        # Convert to RGB (face_recognition uses RGB)
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Detect faces
        face_locations = face_recognition.face_locations(rgb_img)
        
        if not face_locations:
            raise HTTPException(status_code=400, detail="No face detected")
        
        if len(face_locations) > 1:
            # Optional: Allow multiple? For now strict 1 face for registration/verification
            pass

        # Get encodings
        encodings = face_recognition.face_encodings(rgb_img, face_locations)
        
        if not encodings:
             raise HTTPException(status_code=400, detail="Could not encode face")

        # Return the first encoding found
        return {"encoding": encodings[0].tolist()}

    except Exception as e:
        print(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
