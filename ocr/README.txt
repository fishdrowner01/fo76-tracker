Offline OCR assets (place files here)

Required files (download and add into this folder):

1) worker.min.js
   - https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js
   - https://unpkg.com/tesseract.js@5/dist/worker.min.js
   - https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.3/worker.min.js

2) tesseract-core.wasm.js
   - https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0/dist/tesseract-core.wasm.js
   - https://unpkg.com/tesseract.js-core@5.0.0/dist/tesseract-core.wasm.js
   - https://cdnjs.cloudflare.com/ajax/libs/tesseract.js-core/5.0.0/tesseract-core.wasm.js

3) eng.traineddata.gz
   - https://tessdata.projectnaptha.com/5/eng.traineddata.gz

Place them as:
  ./ocr/worker.min.js
  ./ocr/tesseract-core.wasm.js
  ./ocr/eng.traineddata.gz
