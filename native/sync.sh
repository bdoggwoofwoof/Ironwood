#!/bin/sh
# Copy the latest web build into the iOS app and update the Xcode project.
# Run on a Mac after: cd .. && python3 build.py
set -e
cd "$(dirname "$0")"
rm -rf www && cp -r ../dist www
npx cap sync ios
echo "Now open ios/App/App.xcodeproj in Xcode (or run: npx cap open ios)."
