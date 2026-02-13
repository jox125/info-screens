# info-screens

## Tech Stack
- **Node.js**
- **Express.js**
- **Socket.IO**
  
## Running the application
### Development config
Race timer in development config is 1 minute
```bash
npm run dev
```

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
### Front Desk
- Can add, remove and edit sessions providing a name
- Can add, remove and edit drivers providing a name and optionally a car number
- Ability to view upcoming sessions and drivers
- Cannot create multiple drivers with the same name or racecar number in one session
- Accessible only with the receptionist key via "/front-desk"
- Displays feedback based on operation type (successful, error)