const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $geoLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML


//Options, ignores the ? when parsing
const { username, room } = Qs.parse(location.search,{ ignoreQueryPrefix: true })

// auto scroll down on new messages when user is viewing latest message
const autoscroll = ()=>{
    // new message element
    const $newMessage = $messages.lastElementChild
    // height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    // bottom margin of the message
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight +newMessageMargin
    // height of the amount of content of the message screen you can view
    const visibleHeight = $messages.offsetHeight
    // height of the messages container, height of entire message box (all messages)
    const containerHeight = $messages.scrollHeight
    // how far have you scrolled down from the top + the height of the chat you can see currently
    const scrollOffset = $messages.scrollTop + visibleHeight
    console.log(newMessageMargin)
    // height of the messages container minus new message is previous view height
    // if it is less than or equal to the top to current view, then we're at the bottom
    // if it is not -> more messages at bottom-> current view is not at bottom
    if(containerHeight - newMessageHeight <= scrollOffset){
        // scroll to the bottom where the new message is at
        $messages.scrollTop = $messages.scrollHeight
    }
}

// welcome message on joining
socket.on('welcomeMessage',(message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm:A'),
    })
    // insert new messages at the bottom of $messages
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

// sending location to chat
socket.on('locationMessage',(location)=>{
    console.log(location)
    const html = Mustache.render(locationMessageTemplate,{
        username: location.username,
        location: location.location,
        createdAt: moment(location.createdAt).format('h:mm:A'),
    })
    // insert new location message at bottom of $messages
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})


socket.on('roomData',({room,users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

// when a message is submitted
$messageForm.addEventListener('submit',(e)=>{
    // stop the document from refreshing on every update
    e.preventDefault()
    // disable the form while message is being sent
    $messageFormButton.setAttribute('disabled','disabled')
    // target is what we're listening to the event on, the form, 
    // then access the elemnts by name (message), then grab the value
    const message = e.target.elements.message.value
    socket.emit('sendMessage',message,(error)=>{
        // renable the form after message is sent
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('message was delivered!')
    })
})


// message from server send to client
socket.on('message',(message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        username: message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm:A')
    })
    // insert messages at the bottom of the message div
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})



$geoLocationButton.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }
    $geoLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',{
            'lat':position.coords.latitude,
            'long':position.coords.longitude},(message)=>{
                console.log(message)
            })
        $geoLocationButton.removeAttribute('disabled')
    })
})


socket.emit('join', {username, room},(error)=>{
    if(error){
        alert(error)
        // redirect user back to home page
        location.href='/'
    }
})