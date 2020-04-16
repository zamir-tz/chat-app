const socket = io();

// elements
const $messageForm = document.querySelector('#messageForm');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const locationShare = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true});

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How far have i scrolled
    const scrollOfset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOfset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('H:mm')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (url) => {
    console.log(url);
    const html = Mustache.render(locationTemplate, {
        username: url.username,
        url: url.locationUrl,
        createdAt: moment(url.createdAt).format('H:mm')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({room, users}) => {
    
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html;
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    $messageFormButton.setAttribute('disabled', 'disabled');
    
    const chatMessage = e.target.elements.message.value;

    socket.emit('sendMessage', chatMessage, (error) => {
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();    

        if (error) {
            return console.log(error);
        }
        
        console.log('the message was delivered');
    });
});

locationShare.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser');
    }

    locationShare.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('send-location', {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
        }, () => {
            locationShare.removeAttribute('disabled');
            console.log('Location shared');
        });
    });
});

socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});