#!/bin/sh
npm run build && gsutil cp ./dist/index.html gs://cdn.vuukle.com/widgets/ && gsutil cp ./dist/authentication-progress.html gs://cdn.vuukle.com/widgets/
