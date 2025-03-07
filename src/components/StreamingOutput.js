import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import axios from 'axios';
import { clientCredentials } from 'axios-oauth-client';

const StreamingOutput = () => {
  const [output, setOutput] = useState('');
  const [topic, setTopic] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const outputRef = useRef(null);

  // Fetch OAuth2 token on component mount
  useEffect(() => {
    const getToken = async () => {
      try {
        const consumerKey = window?.configs?.consumerKey || '';
        const consumerSecret = window?.configs?.consumerSecret || '';
        const tokenUrl = window?.configs?.tokenUrl || '';

        if (consumerKey && consumerSecret && tokenUrl) {
          const getClientCredentials = clientCredentials(
            axios.create(),
            tokenUrl,
            consumerKey,
            consumerSecret
          );
          const auth = await getClientCredentials();
          setAccessToken(auth.access_token);
          console.log('Access Token:', auth.access_token); // Debug
        } else {
          console.warn('OAuth2 credentials not provided, skipping token fetch');
        }
      } catch (error) {
        console.error('Failed to fetch token:', error);
        setOutput(`Error fetching token: ${error.message}`);
      }
    };
    getToken();
  }, []);

  const startStreaming = async () => {
    setOutput('Connecting...');
    let content = '';

    try {
      const apiUrl = window?.configs?.apiUrl || window?.configs?.serviceUrl || 'http://localhost:8080';
      console.log('Requesting URL:', `${apiUrl}/stream`); // Debug

      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${apiUrl}/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topic: topic.trim() || 'simple post endpoint',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          content += '\n';
          setOutput(marked.parse(content) || content);
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
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