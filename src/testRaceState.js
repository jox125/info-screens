export const raceState = {
    sessions: [
        {
            id: 1,
            name: '1',
            status: 'in progress',
            drivers: [
                { id: 1, name: 'Alex', carNum: 1 },
                { id: 2, name: 'Ben', carNum: 3 },
                { id: 3, name: 'Chris', carNum: 6 }
            ]
        },
        {
            id: 2,
            name: '2',
            status: 'next',
            drivers: [
                { id: 4, name: 'Dana', carNum: 2 },
                { id: 5, name: 'Elliot', carNum: 5 },
                { id: 6, name: 'Finn', carNum: 8 },
                { id: 7, name: 'Gabe', carNum: 4 }
            ]
        },
        {
            id: 3,
            name: '3',
            status: 'upcoming',
            drivers: []
        },
        {
            id: 4,
            name: '4',
            status: 'finished',
            drivers: [
                { id: 8, name: 'Hugo', carNum: 1 },
                { id: 9, name: 'Ivan', carNum: 2 }
            ]
        },
        {
            id: 5,
            name: '5',
            status: 'upcoming',
            drivers: [
                { id: 10, name: 'Jack', carNum: 7 },
                { id: 11, name: 'Kai', carNum: 4 },
                { id: 12, name: 'Leo', carNum: 2 },
                { id: 13, name: 'Mason', carNum: 8 },
                { id: 14, name: 'Noah', carNum: 1 }
            ]
        },
        {
            id: 6,
            name: '6',
            status: 'in progress',
            drivers: [
                { id: 15, name: 'Owen', carNum: 3 },
                { id: 16, name: 'Parker', carNum: 6 },
                { id: 17, name: 'Quinn', carNum: 1 },
                { id: 18, name: 'Ryan', carNum: 8 },
                { id: 19, name: 'Sam', carNum: 5 },
                { id: 20, name: 'Theo', carNum: 2 }
            ]
        },
        {
            id: 7,
            name: '7',
            status: 'finished',
            drivers: [
                { id: 21, name: 'Uma', carNum: 4 }
            ]
        },
        {
            id: 8,
            name: '8',
            status: 'next',
            drivers: [
                { id: 22, name: 'Victor', carNum: 1 },
                { id: 23, name: 'Will', carNum: 2 },
                { id: 24, name: 'Xander', carNum: 3 },
                { id: 25, name: 'Yuri', carNum: 4 },
                { id: 26, name: 'Zane', carNum: 5 },
                { id: 27, name: 'Aaron', carNum: 6 },
                { id: 28, name: 'Blake', carNum: 7 },
                { id: 29, name: 'Cole', carNum: 8 }
            ]
        },
        {
            id: 9,
            name: '9',
            status: 'upcoming',
            drivers: [
                { id: 30, name: 'Dylan', carNum: 6 },
                { id: 31, name: 'Evan', carNum: 2 },
                { id: 32, name: 'Felix', carNum: 5 }
            ]
        },
        {
            id: 10,
            name: '10',
            status: 'finished',
            drivers: [
                { id: 33, name: 'George', carNum: 1 },
                { id: 34, name: 'Harry', carNum: 4 },
                { id: 35, name: 'Isaac', carNum: 7 },
                { id: 36, name: 'Jonah', carNum: 8 }
            ]
        }
    ],
    currentRace: null,
    raceMode: 'safe',   // safe, hazard, danger, finish
    duration: 60000
}
