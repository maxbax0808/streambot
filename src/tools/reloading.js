import React from 'react'

const apiUrl = 'https://api.betterplace.org'
// const apiUrl = 'https://api.bp42.com'

const resolveToApiUrl = (match, searchParams, counter) => {
  let list = searchParams.get('list')
  // TODO: This is weird logic!
  // `list` is always 1 or 'true' (which evals as 1 in api_v4)
  // https://github.com/betterplace/streambot/commit/04d5b23263adad3762ed5e4a0343ca2fa34aa935#r53168860
  if (list === 'true') {
    counter = 1
  } else {
    list = 1
  }

  let since = searchParams.get('since') || ''
  if (since && since.length) {
    since = `&facets=since:${since}`
  }
  switch (match.path) {
    case '/fundraising-events/:id/progress':
    case '/fundraising-events/:id/total':
      return `${apiUrl}/api_v4/fundraising_events/${match.params.id}`
    case '/fundraising-events/:id/last-donation':
    case '/fundraising-events/:id/donation-alert':
      return `${apiUrl}/api_v4/fundraising_events/${match.params.id}/opinions?order=id:desc&per_page=${list}&page=${counter}`
    case '/fundraising-events/:id/top-donation':
      return `${apiUrl}/api_v4/fundraising_events/${match.params.id}/opinions?order=amount_in_cents:desc&per_page=${list}&page=${counter}${since}`
    case '/fundraising-events/:id/top-donor':
      return `${apiUrl}/api_v4/fundraising_events/${match.params.id}/sum_donations?per_page=${list}&page=${counter}`
    case '/fundraising-events/:id/last-comment':
      return `${apiUrl}/api_v4/fundraising_events/${match.params.id}/opinions?order=id:desc&per_page=${list}&page=${counter}&facets=has_message:true`
    case '/fundraising-events/:id/hashtags':
      return `${apiUrl}/api_v4/fundraising_events/${match.params.id}/hashtag_counts/${searchParams.get('hashtags')}`
    default:
      return null
  }
}

let demoDataIntervals = 0

const demoData = (match, params) => {
  switch (match.path) {
    case '/fundraising-events/:id/progress':
    case '/fundraising-events/:id/total':
      return { donated_amount_in_cents: 1337, requested_amount_in_cents: 4200, progress_percentage: 31, }
    case '/fundraising-events/:id/last-donation':
    case '/fundraising-events/:id/donation-alert':
    case '/fundraising-events/:id/top-donation':
    case '/fundraising-events/:id/top-donor':
    case '/fundraising-events/:id/last-comment':
      const last_comments = [
        { id: Math.round(Date.now() / 10000), donated_amount_in_cents: 1337, author: { name: 'Unicorn&lt;3' }, message: 'Voll l33t dein Stream &amp; deine Show!' },
        { id: Math.round(Date.now() / 10000), donated_amount_in_cents: 1200, author: { name: 'Peter' }, message: 'Super Stream!' },
        { id: Math.round(Date.now() / 10000), donated_amount_in_cents: 900, author: { name: 'Anna' }, message: 'Mega!' },
        { id: Math.round(Date.now() / 10000), donated_amount_in_cents: 500, author: { name: 'Patrick' }, message: 'Richtig gut!' },
        { id: Math.round(Date.now() / 10000), donated_amount_in_cents: 400, author: { name: 'Larissa' }, message: 'Finde die Aktion super!' }
      ]
      const maxCount = parseInt(params.get('maxCount') || 1, 10)
      const index = demoDataIntervals % Math.min(last_comments.length, maxCount)
      const returnValue = last_comments[index]
      demoDataIntervals++
      return returnValue
    case '/fundraising-events/:id/hashtags':
      return { Wahrheit: 21, Pflicht: 26, Egal: 3 }
    default:
      return null
  }
}
const fallbackData = (match) => {
  switch (match.path) {
    case '/fundraising-events/:id/last-donation':
    case '/fundraising-events/:id/top-donation':
    case '/fundraising-events/:id/top-donor':
    case '/fundraising-events/:id/last-comment':
      return { author: { name: "-" } }
    default:
      return null
  }
}

export function reloading(WrappedComponent) {
  return class extends React.Component {
    constructor(props) {
      super(props);
      const params = new URLSearchParams(this.props.location.search)
      const demo = params.get('demo')
      const maxCount = parseInt(params.get('maxCount') || 1, 10)
      this.state = { data: null, listData: [], demo, params, counter: 1, maxCount }
    }

    componentDidMount() {
      const intervalSeconds = parseInt(this.state.params.get('interval'), 10) || 3
      this.reloadData()
      this.interval = setInterval(() => this.reloadData(), intervalSeconds * 1000)
    }

    componentWillUnmount() {
      clearInterval(this.interval)
    }

    reloadData = () => {
      const url = resolveToApiUrl(this.props.match, this.state.params, this.state.counter)
      const nextCounter = (this.state.counter >= this.state.maxCount) ? 1 : this.state.counter + 1

      this.setState({ counter: nextCounter }, () => {
        // If demo data is requested do not query the API
        if (this.state.demo) {
          console.log(`Demo Mode: API Request would have been: "${url}".`)
          return this.storeData(demoData(this.props.match, this.state.params))
        }
        fetch(url)
          .then(response => response.json())
          .then(json => this.storeData(json))
          .then(undefined, err => console.log(err))
      })
    }

    // From a list response, take the first entry, otherwise store the whole response.
    // This way it's always exactly one object from the API that is stored into
    // `props.data` - could be a fundraising event or a opinion or whatever.
    // store a list of data into listData as well.
    storeData = (responseJson) => {
      let data, listData
      if (Array.isArray(responseJson.data)) {
        data = responseJson.data[0]
        listData = responseJson.data
      } else {
        data = responseJson
        listData = [responseJson]
      }
      this.setState({ data, listData })
    }

    render() {
      let { data, listData, params } = this.state

      if (!data) {
        data = fallbackData(this.props.match)
        listData = [data]
      }

      if (!data) { return null }

      return <React.Fragment>
        <WrappedComponent params={params} data={data} listData={listData} {...this.props} />
      </React.Fragment>
    }
  }
}
