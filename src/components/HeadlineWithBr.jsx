import React from 'react'

export const HeadlineWithBr = ({content}) => {
  if (!content || 0 === content.length || content === 'false') return null
  return <React.Fragment>{content}<br/></React.Fragment>
}
