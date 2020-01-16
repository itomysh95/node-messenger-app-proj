const users = []

const addUser = ({id, username, room}) =>{
    // clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()
    // validate the data
    if(!username || !room){
        return {
            error: "username and room are required"
        }
    }
    // check for existing user
    const existingUser = users.find((user)=>{
        return user.room === room && user.username === username
    })
    // validate username
    if (existingUser){
        return{
            error: "Username is in use!"
        }
    }
    // Store user
    const user = { id, username, room }
    users.push(user)
    return{ user }
}

const removeUser = (id) =>{
    // -1 for no match
    const index = users.findIndex((user)=> user.id === id)
    if(index !==-1){
        // array of items to be removed, we only have 1
        return users.splice(index,1)[0]
    }
}

// return the user by id
const getUser = (id) =>{
    return users.find((user)=>user.id===id)
}

const getUsersInRoom = (roomName) => {
    roomName = roomName.trim().toLowerCase()
    return users.filter((user)=>user.room === roomName)
    
}

module.exports = {
    addUser,
    removeUser,
    getUsersInRoom,
    getUser,
}