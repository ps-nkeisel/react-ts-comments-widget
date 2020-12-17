#!/bin/sh
npm run build:dev && gsutil cp ./dist/index.html gs://cdntest.vuukle.com/widgets/ && gsutil cp ./dist/authentication-progress.html gs://cdntest.vuukle.com/widgets/
