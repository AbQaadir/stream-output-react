import React, { useState, useRef } from 'react';
import { marked } from 'marked';

const StreamingOutput = () => {
  const [output, setOutput] = useState('');
  const [topic, setTopic] = useState('');
  const outputRef = useRef(null);

  const startStreaming = async () => {
    setOutput('Connecting...');
    let content = '';

    try {
      const encodedTopic = encodeURIComponent(topic.trim() || 'simple post endpoint');
      // Use window.configs.serviceUrl from config.js
      const response = await fetch(`${window.configs.serviceUrl}/stream/${encodedTopic}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          content += '\n';
          setOutput(marked.parse(content) || content);
          break;
        }
        const chunk = decoder.decode(value);
        content += chunk;
        setOutput(marked.parse(content) || content);
      }
    } catch (error) {
      content += `\nError: ${error.message}`;
      setOutput(marked.parse(content) || content);
    }
  };

  return (
    <div>
      <h1>FastAPI Streaming Output</h1>
      <div>
        <input
          type="text"
          id="topicInput"
          placeholder="Enter topic here"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button onClick={startStreaming}>Start Streaming</button>
      </div>
      <div
        id="output"
        ref={outputRef}
        dangerouslySetInnerHTML={{ __html: output }}
      />
    </div>
  );
};

export default StreamingOutput;