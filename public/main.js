const socket = io()
const config = { 
    iceServers: [

    ],
    sdpSemantics : "unified-plan"
}

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let _localStream
let _localScreenStream
let peerConnection
const remoteMediaStream = new MediaStream();

const initPC = async () => {
    const pc = new RTCPeerConnection(config)

    if(_localStream) {
        for (const track of _localStream.getTracks()) {
            pc.addTrack(track, _localStream)
        }
    }

    if(_localScreenStream) {
        for (const track1 of _localScreenStream.getTracks()) {
            pc.addTrack(track1, _localScreenStream)
        }
    }

    pc.onicecandidate = ({ candidate }) => {
        if (!candidate) return

        console.log('peerConnection::icecandidate', candidate)
        socket.emit('iceCandidate', candidate)
    }

    pc.ontrack = (evt) => {
        console.log('peerConnection::track', evt)
        remoteMediaStream.addTrack(evt.track)
        remoteVideo.srcObject = remoteMediaStream
    }

    return pc
}

const startConn = async () => {
    document.getElementById("start-conn").disabled = true
    
    peerConnection = await initPC()

    peerConnection.createOffer()
		.then(offer => {
			return peerConnection.setLocalDescription(offer)
		})
		.then(() => {
			// wait for ICE gathering to complete
			return new Promise(resolve => {
				if (peerConnection.iceGatheringState === 'complete') {
					resolve(true)
				} else {
					const checkState = () => {
						if (peerConnection.iceGatheringState === 'complete') {
							peerConnection.removeEventListener(
								'icegatheringstatechange',
								checkState
							)
							resolve(true)
						}
					}

					peerConnection.addEventListener('icegatheringstatechange', checkState)
				}
			})
		})
		.then(async () => {
			if (peerConnection.localDescription) {
				const offer = peerConnection.localDescription

                socket.emit('offer', offer)

				return
			}
		})
		.catch(e => {
			alert(e)
		})
}

socket.on('offer', async (offer) => {
    peerConnection = await initPC()
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    const answerObj = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answerObj)

    socket.emit('answer', answerObj)
})

socket.on('answer', async (answer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
})

socket.on('iceCandidate', (ice) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(ice))
})



document.getElementById("start-conn").onclick = startConn

document.getElementById("add-camera").onclick = async () => {

    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
    }).then(stream => {
        _localStream = stream;

        localVideo.srcObject = stream;
    })
}

document.getElementById("add-screen").onclick = async () => {
    const constraints = { video: { cursor: 'always' }, audio: false }

    navigator.mediaDevices.getDisplayMedia(constraints).then(stream => {
        _localScreenStream = stream;

        localVideo.srcObject = stream;
    })
}
