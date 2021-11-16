import { Suspense, useState, useRef, useCallback, useMemo } from "react"
import HtmlParser from "react-html-parser"
import Placeholder from "react-placeholder"
import { suspend, preload } from "suspend-react"

const FIRST = 9060
const PRELOAD = 3

const fetchHN = async (id) => {
  let data = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((res) => res.json())
  data.text = HtmlParser(data.text)
  if (data.parent) {
    let post = data
    while (post.parent) post = await fetch(`https://hacker-news.firebaseio.com/v0/item/${post.parent}.json`).then((res) => res.json())
    data.title = `re: ${post.title}`
  }
  return data
}

function Post({ id }) {
  const { by, title, url, text, time } = suspend(fetchHN, [id])
  return (
    <div style={{ marginBottom: "4em" }}>
      <h2>{by}</h2>
      <h6>{new Date(time * 1000).toLocaleDateString("en-US")}</h6>
      {title && <h4>{title}</h4>}
      <a href={url}>{url}</a>
      {text}
    </div>
  )
}

export default function App() {
  const content = useRef()
  const [count, set] = useState(10)
  const items = useMemo(() => [...Array(count).keys()], [count])
  const fetchPosts = useCallback((e) => e.target.scrollTop > content.current.scrollHeight - document.body.clientHeight && set((count) => count + 1), [])
  for (let i = 0; i < PRELOAD; i++) preload(fetchHN, [FIRST + count + i])
  return (
    <div className="scroll" onScroll={fetchPosts}>
      <div className="content" ref={content}>
        {items.map((index) => (
          <Suspense key={FIRST + index} fallback={<Placeholder ready={false} type="text" rows={10} color="#d0d0d0" style={{ marginBottom: "4em" }} />}>
            <Post id={FIRST + index} />
          </Suspense>
        ))}
      </div>
    </div>
  )
}
