import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import axios from 'axios';
import oauth from 'axios-oauth-client';

const StreamingOutput = () => {
  const [output, setOutput] = useState('');
  const [topic, setTopic] = useState('');
  const outputRef = useRef(null);
  const [accessToken, setAccessToken] = useState('');

  // Fetch OAuth2 token on component mount
  useEffect(() => {
    const getToken = async () => {
      try {
        const apiUrl = window?.configs?.apiUrl || '/';
        const consumerKey = window?.configs?.consumerKey || '';
        const consumerSecret = window?.configs?.consumerSecret || '';
        const tokenUrl = window?.configs?.tokenUrl || '';

        if (consumerKey && consumerSecret && tokenUrl) {
          const getClientCredentials = oauth.clientCredentials(
            axios.create(),
            tokenUrl,
            consumerKey,
            consumerSecret
          );
          const auth = await getClientCredentials();
          setAccessToken(auth.access_token);
        }
      } catch (error) {
        console.error('Failed to fetch token:', error);
      }
    };
    getToken();
  }, []);

  const startStreaming = async () => {
    setOutput('Connecting...');
    let content = '';

    try {
      const apiUrl = window?.configs?.apiUrl || window?.configs?.serviceUrl || 'http://localhost:9900';
      const config = {
        method: 'POST',
        url: `${apiUrl}/stream`,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }), // Add token if available
        },
        data: {
          topic: topic.trim() || 'simple post endpoint',
        },
        responseType: 'stream',
      };

      const response = await axios(config);
      const reader = response.data.getReader();
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