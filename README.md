# react-native-snap-shooter
The aim of this library is to allow take snap shots of your simple demo application in various React Native versions in simplified way.

The most common use case for this library is to **test that your library works well in various RN versions**.
Since RN is developed rapidly (which is good thing on one side) it comes with breaking changes from time to time.
That can be changes to API (which cause malfunction directly but usually is more obvious) or changes to layouting.

Since it is lot of effort to test your library in all version we made this tool that do it for you by **comparing snap shots** between RN versions.

Another possible use-case is to **dissect RN** to find out **where bug was introduced.**

## Getting started
1. Setup simple testing project with `package.json` like
  ```
  {
    "name": "your-snap-test",
    "private": true,
    "version": "0.1.0",
    "scripts": {
      "start": "snap-shooter",
      "test": "snap-shooter --check"
    },
    "dependencies": {
      "react-native-snap-shooter": "*"
    }
  }
  ```
  and run `npm install` in it.

2. Create simple definition file `demo/shooter.json` like
  ```
  {
    "dependencies": {
      "your-lib": "1.0.0"
    },
    "rnVersions" : ["0.34.1", "0.35.0", ">0.38.0", "RC"]
  }
  ```
  where you define dependency for your library and RN versions you want to test (`RC` stands for latest available rc version)
  Check [default values](runner/util/config.js) to see more options.

3. Create simple RN component that use your library in file `demo/DemoApp.js`. This is the starting point that will be imported into testing RN project (together with other files you put into `demo` directory) and will be snap shot.

Then execute `npm start` to get snap shots and `npm test` to compare them. Check [example](example/) for working demo.

## Current status
Currently we want to validate if community is interested in such project.
It generally works in good case (both platforms - just Android needs running simulator - same as per `react-native run-android`) but still needs improvements to handle various edge cases.

## Prerequisites and limitations
It requires all tools needed to develop and run RN applications especially following
* "shell" ( MacOS, ...)
* Node.js 6
* global `react-native-cli` at least version `0.2`

Since we make "end to end" testing for multiple RN versions, the process is slow ( several minutes per version).
We use [react-native-view-shot](https://github.com/gre/react-native-view-shot) and *snapshots are not guaranteed to be pixel perfect* among other caveats.
For image comparison we use [jimp](https://github.com/oliver-moran/jimp) that allows us to find image distance so that allows you to find how bad the changes are.

## TODO
Plan for future roughly based on priority (any help is welcomed).

- [x] basic IOS prototype for taking snapshots/screenshots
- [x] compare images
- [x] wildcard RN versions
- [x] "diff runs" ( will check only new RN versions etc)
- [x] Android support
- [ ] ability to set target simulator(s)
- [ ] more suitable output format
- [ ] ability to take more snapshots
- [ ] dissect RN on commit level

If you are interested in a particular feature, raise a issue (or +1 existing one).
PRs are welcomed.

## Troubleshooting
### Android does not receive snapshots
When you see `adb server version (%d) doesn't match this client (%d)` in console output it means that you have to make sure that your simulator is using same version as `react-native` (most likely `$ANDROID_HOME/platform-tools/adb`)
