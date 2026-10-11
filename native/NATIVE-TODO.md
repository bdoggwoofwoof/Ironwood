# Ironwood iOS app — what's set up and what's next

## Set up (Oct 10)
- Capacitor 8 iOS project (`ios/App/App.xcodeproj`), Swift Package Manager, no CocoaPods.
- App name Ironwood, bundle ID `com.newt.ironwood` (change to one you own in Xcode → Signing & Capabilities and in `capacitor.config.ts`).
- Portrait only, dark appearance, dark launch screen, app icon (1024 px, opaque).
- Camera and save-to-Photos permission messages in Info.plist.
- `ITSAppUsesNonExemptEncryption = NO`, so App Store Connect won't ask about encryption on every build.
- `PrivacyInfo.xcprivacy` (Oct 11): no tracking, no collected data, UserDefaults declared with reason CA92.1. Added to the Resources build phase; check it shows under App in Xcode.
- The web app inside is the same build as the home-screen version (`../dist`). `sync.sh` copies the latest build in.

## Not tested
Nothing here has been built yet: that needs a Mac with Xcode. First run on a Mac:

1. `npm install`
2. `./sync.sh`
3. Open `ios/App/App.xcodeproj`, choose your Team under Signing, plug in the iPhone, Run.

## Native to-dos (from the plan, in rough order)
1. **Saving files**: backups and photos currently use the web share sheet. In the app, use `@capacitor/share` + `@capacitor/filesystem` so Save backup file and Save to Photos always work.
2. **Lock-screen timer alerts**: `@capacitor/local-notifications` for rest and interval timers, replacing the silent-audio workaround. Ask for notification permission only when a timer starts (guideline 5.1.2: never required to use the app).
3. **Haptics**: `@capacitor/haptics` on swipe complete, PRs and timer ends.
4. **Durable storage**: workouts live in the web view's localStorage. Move them to `@capacitor/preferences` or a file so iOS can never clear them under storage pressure; keep the JSON backup format.
5. **Live camera**: already works in the web view once camera permission is granted; check the pose outline view on a real phone.
6. **Translations**: bundle the 10 languages instead of translating through Claude (not available outside Claude).
7. **First launch**: offer Restore from a backup file so the home-screen version's data moves over.
