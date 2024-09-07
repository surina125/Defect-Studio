import io

import uvicorn
from PIL import Image
from fastapi import FastAPI

from util import upload_files, delete_files

app = FastAPI()


@app.get('/upload')
def upload():

    # Image 1
    im = Image.open("./dog.png")
    stream1 = io.BytesIO()
    im.save(stream1, format="jpeg", quality=90)
    stream1.seek(0)

    # Image 2
    im = Image.open("./cat.png")
    stream2 = io.BytesIO()
    im.save(stream2, format="jpeg", quality=90)
    stream2.seek(0)

    stream_list = [stream1, stream2]

    list = upload_files(stream_list)
    return {'url_list': list}


@app.get('/delete')
def upload():
    key = 'temp'
    delete_files(2, key)


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
