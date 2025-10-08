Offline OCR assets:
This build will try to use local files first:
  ./ocr/worker.min.js
  ./ocr/tesseract-core.wasm.js
  ./ocr/eng.traineddata.gz
If they are missing, the app will download them once from official mirrors and cache them for offline use.
