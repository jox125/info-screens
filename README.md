# info-screens

A real-time race management system built for Beachside Racetrack. This application manages race sessions, 
tracks lap times, controls safety flags, and displays real-time leaderboards using WebSockets.

## Tech Stack
- **Vanilla HTML/CSS/JS**
- **Node.js**
- **Express.js**
- **Socket.IO**
- **JSON file storage**

## Setup & Installation

1. **Prerequisites:** Ensure you have Node.js installed on your machine.
2. **Install Dependencies:**
   Navigate to the project root and run:
   ```bash
   npm install
   ```
  
## Running the application
### Development config
Race timer in development config is 1 minute
```bash
npm run dev
```

Once started, the server usually runs on port `3000` (e.g., `http://localhost:3000`).

>[!NOTE]
>The server will not run if [access keys](#access-keys) are not defined

## Access keys
Access keys can be set in '.env' file or by running following commands in terminal
```bash
export RECEPTIONIST_KEY=key1
export SAFETY_KEY=key2
export OBSERVER_KEY=key3
```

## Interfaces
### 1. Front Desk
- Can add, remove and edit sessions providing a name
- Can add, remove and edit drivers providing a name and optionally a car number
- Ability to view upcoming sessions and drivers
- Cannot create multiple drivers with the same name or racecar number in one session
- Accessible only with the receptionist key via "/front-desk"
- Displays feedback based on operation type (successful, error)

### 2. Race Control (Safety Official)

- **Route:** `/race-control`
- **Access:** Requires `SAFETY_KEY`
#### **Features:**
- **Start Race:** Activates the session marked as "Next", starts the timer, and sets mode to "Safe".
- **Flag Control** (Change race conditions in real-time):
  - **Safe:** Normal racing conditions.
  - **Hazard:** Caution required.
  - **Danger:** Race stopped.
  - **Finish:** End of race.
- **End Session:** Closes the current session and advances the queue to the next upcoming race.

### 3. Lap-line Tracker (Observer)

- **Route:** `/lap-line-tracker`
- **Access:** Requires `OBSERVER_KEY`
#### **Features:**
- Displays a grid of large buttons for every car in the active session.
- **One-Tap Recording:** Tapping a car number records a lap and updates the leaderboard immediately.
- **Validation:** Buttons are only active when a race is "In Progress".

### 4. Public Displays (No Login Required)

| Interface        | Route | Description                                                                                                                                                         |
|------------------| --- |---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Leader Board** | `/leader-board` | Shows live rankings with driver names and car numbers, current safety flag, <br/>current lap, fastest lap times, and race timer. Shows final results between races. |
| **Next Race**    | `/next-race` | Displays the list of drivers and assigned cars for the upcoming session so drivers know where to go.                                                                |
| **Race Flags**   | `/race-flags` | Displays the current safety flag ("Safe" (green),"Hazard" (yellow),"Danger" (red),"Finish" (chequered)) to drivers on track.                                          |
| **Countdown**    | `/race-countdown` | A dedicated large timer screen that shows how long does the session last.                                                                                           |

Click the "Full Screen" button on any of them to maximize.


##  Data Persistence

This application implements file-system persistence.

- **Location:** `src/config/race-state.json`
- **Behavior:** Every time a race action occurs (Start, Lap Recorded, Flag Change), the state is saved to this JSON file.
- **Crash Recovery:** If the server restarts, it reloads the state from this file.


## Online Access

To access this application from anywhere, you can use Ngrok.

### Setup & Installation

1. Create an Account
- You must have an account to receive an authentication token. 
- Go to the ngrok Sign Up page and register via email, Google, or GitHub.

2. Install the ngrok Agent
The installation method depends on your operating system:
- **Windows** (2 options):
  - Download the ZIP file from the ngrok Windows Download page, extract ngrok.exe, and optionally move it to a folder in your system PATH for easier access.
  - Or download via terminal using command: 
  ```
  winget install ngrok.ngrok
  ```
- **macOS:** The easiest way is using Homebrew: brew install ngrok/ngrok/ngrok.
- **Linux:** You can use Snap (sudo snap install ngrok) or download the binary directly from the ngrok Linux Download page and extract it.

3. Connect Your Account (Authentication)
   1. Once installed, you must link your local agent to your ngrok account using your unique Authtoken.
   2. Log in to your ngrok Dashboard.
   3. Copy your token from the Your Authtoken section.
   4. Run the following command in your terminal/command prompt:
   ```
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

4. Start a Tunnel 
<br/>Expose a local web server, use the http command:
    ```
    ngrok http 3000
    ```

Ngrok will generate a public URL (e.g., https://random-id.ngrok-free.dev) that tunnels directly to your local machine.

*Note: Windows users may need to use ./ngrok.exe if the executable isn't in their PATH.* 
