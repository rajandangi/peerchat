let APP_ID = "b5c070d4959649b09efec7a801228ae8"
let localStream;
let remoteStream;
let peerConnection;

let token = null;
let uid = String(Math.floor(Math.random() * 10000));

let client;
let channel;

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }
    ]
}

let init = async () => {
    client = await AgoraRTM.createInstance(APP_ID)
    await client.login({ uid, token });

    //index.html?room=235434
    channel = client.createChannel('main');
    await channel.join();

    channel.on('MemberJoined', handleUserJoined)

    client.on('MessageFromPeer', handleMessageFromPeer)

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    document.getElementById('user-1').srcObject = localStream;
}

let handleMessageFromPeer = async (message, memberId) => {
    message = JSON.parse(message.text);
    console.log('Message :', message);
}

let handleUserJoined = async (MemberId) => {
    console.log('A new user joined the channel:', MemberId)
    createOffer(MemberId)
}

let createPeerConnection = async (MemberId) => {
    peerConnection = new RTCPeerConnection(servers);

    remoteStream = new MediaStream();
    document.getElementById('user-2').srcObject = remoteStream;

    if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        document.getElementById('user-1').srcObject = localStream;
    }

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    })

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
        })
    }

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'candidate', 'candidate': event.candidate }) }, MemberId)
        }
    }
}
let createOffer = async (MemberId) => {
    await createPeerConnection(MemberId);

    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'offer', 'offer': offer }) }, MemberId)
}

let createAnswer = async (MemberId) => {

}
init();