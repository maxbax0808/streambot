import React from 'react'
import { formatCents } from '../tools'
import { Nickname } from '.'

export class DonationAlert extends React.Component {
  constructor(props) {
    super(props)
    const params = new URLSearchParams(this.props.location.search)
    this.state = {
      hidden: true,
      gif: params.get('gif'),
      gifHeight: params.get('gifHeight') || 'inherit',
      duration: params.get('duration') || 3,
      wording: params.get('wording') === null ? 'Neue Spende' : params.get('wording'),
      volume: params.get('volume') || 0.9,
      data: {
        id: null,
        author: null,
        amountInCents: null,
        played: true,
      },
    }

    if (params.get('mp3')) {
      this.audioElement = new Audio(params.get('mp3'))
      this.audioElement.loop = false
      this.audioElement.volume = this.state.volume
      this.audioElement.load()
    }
  }

  componentDidUpdate(prevProps) {
    // New ID must exist and differ from previous one.
    if (this.props.data.id && this.props.data.id !== this.state.data.id
      // At least one data field must be present.
      && (this.props.data.donated_amount_in_cents || this.props.data.author)) {
      this.setState({
        hidden: false,
        data: {
          id: this.props.data.id,
          author: this.props.data.author,
          amountInCents: this.props.data.donated_amount_in_cents,
          message: this.props.data.message,
          played: true,
        },
      })
      if (this.timeout) clearInterval(this.timeout)
      this.timeout = window.setTimeout(() => this.setState({hidden: true}), this.state.duration * 1000)
      

    }
  }

  render() {
    if (this.state.hidden) return null
    console.log("New Donation")
    var amount = parseInt(this.state.data.amountInCents)
    console.log("amount as number: " + amount)
    
    console.log("Volume before checks: " + this.audioElement.volume)
    if(amount<500){
      this.audioElement.volume = 0.2
      console.log(">500")
    }
    if(amount>500){
      this.audioElement.volume = 0.3
      console.log(">500")
    }
    if(amount>=1000){
      this.audioElement.volume = 0.5
      console.log(">=1000")
    }
    if(amount>=1500){
      this.audioElement.volume = 0.7
      console.log(">=1500")
    }
    if(amount>=2000){
      this.audioElement.volume = 0.9
      console.log(">=2000")
    }
    if(amount>2500){
      this.audioElement.volume = 1
      console.log(">2500")
    }
    console.log("Volume after checks: " + this.audioElement.volume)
    
    if (this.audioElement) {
      this.audioElement.play()
    }
    if(this.state.data.played){
      let tts = new SpeechSynthesisUtterance(this.state.data.message);
      tts.lang="de-DE";
      tts.volume = 0.6;
      console.log("tts fired");
      window.speechSynthesis.speak(working);
      this.state.data.played = false;
    }
    
    return <div>
      <Gif src={this.state.gif} height={this.state.gifHeight} />
      <br />
      {this.state.wording}
      <br />
      {formatCents(this.state.data.amountInCents, this.props.params) || 'Spende'} von <Nickname {...this.state.data.author} color={this.props.params.get('nicknameColor')} />
    </div>
  }
}

const Gif = ({ src, height }) => {
  if (!src) return null
  return <img src={src} alt='' height={height} />
}
