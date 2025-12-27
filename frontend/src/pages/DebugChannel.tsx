import React, { useState } from 'react';

type DebugResults = Record<string, any>;

const DebugChannel: React.FC = () => {
  const [results, setResults] = useState<DebugResults>({});
  const BASE_URL = 'http://localhost:5000';

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  };

  const testChannelCreation = async () => {
    const user = getUser();
    if (!user) {
      setResults((prev: DebugResults) => ({ ...prev, error: 'No user found in localStorage' }));
      return;
    }

    const payload = {
      tutorId: user.id || user._id,
      name: 'Test Channel',
      organization: 'Test Org',
      description: 'Test Description',
      avatarUrl: '',
      bannerUrl: '',
      socialLinks: {
        website: '',
        twitter: '',
        linkedin: '',
        youtube: ''
      }
    };

    try {
      setResults((prev: DebugResults) => ({ ...prev, creating: 'Creating channel...' }));
      
      const res = await fetch(`${BASE_URL}/api/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseText = await res.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { rawResponse: responseText };
      }

      setResults((prev: DebugResults) => ({
        ...prev,
        creating: null,
        createResponse: {
          status: res.status,
          ok: res.ok,
          data: responseData
        }
      }));
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setResults((prev: DebugResults) => ({
        ...prev,
        creating: null,
        createError: errorMsg
      }));
    }
  };

  const testChannelFetch = async () => {
    const user = getUser();
    if (!user) {
      setResults((prev: DebugResults) => ({ ...prev, error: 'No user found in localStorage' }));
      return;
    }

    try {
      setResults((prev: DebugResults) => ({ ...prev, fetching: 'Fetching channel...' }));
      
      const res = await fetch(`${BASE_URL}/api/channels/${user.id || user._id}`);
      const responseText = await res.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { rawResponse: responseText };
      }

      setResults((prev: DebugResults) => ({
        ...prev,
        fetching: null,
        fetchResponse: {
          status: res.status,
          ok: res.ok,
          data: responseData
        }
      }));
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setResults((prev: DebugResults) => ({
        ...prev,
        fetching: null,
        fetchError: errorMsg
      }));
    }
  };

  const testAllChannels = async () => {
    try {
      setResults((prev: DebugResults) => ({ ...prev, fetchingAll: 'Fetching all channels...' }));
      
      const res = await fetch(`${BASE_URL}/api/channels`);
      const responseText = await res.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { rawResponse: responseText };
      }

      setResults((prev: DebugResults) => ({
        ...prev,
        fetchingAll: null,
        allChannelsResponse: {
          status: res.status,
          ok: res.ok,
          data: responseData
        }
      }));
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setResults((prev: DebugResults) => ({
        ...prev,
        fetchingAll: null,
        allChannelsError: errorMsg
      }));
    }
  };

  const testTutorMapping = async () => {
    const user = getUser();
    if (!user) {
      setResults((prev: DebugResults) => ({ ...prev, error: 'No user found in localStorage' }));
      return;
    }

    try {
      setResults((prev: DebugResults) => ({ ...prev, mappingTesting: 'Testing tutor mapping...' }));
      
      const res = await fetch(`${BASE_URL}/api/debug/tutor-mapping/${user.id || user._id}`);
      const responseText = await res.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { rawResponse: responseText };
      }

      setResults((prev: DebugResults) => ({
        ...prev,
        mappingTesting: null,
        mappingResponse: {
          status: res.status,
          ok: res.ok,
          data: responseData
        }
      }));
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setResults((prev: DebugResults) => ({
        ...prev,
        mappingTesting: null,
        mappingError: errorMsg
      }));
    }
  };

  const user = getUser();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Channel Debug Tool</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Info</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <button
            onClick={testChannelCreation}
            disabled={results.creating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {results.creating || 'Test Channel Creation'}
          </button>
          
          <button
            onClick={testChannelFetch}
            disabled={results.fetching}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {results.fetching || 'Test Channel Fetch'}
          </button>
          
          <button
            onClick={testAllChannels}
            disabled={results.fetchingAll}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {results.fetchingAll || 'Test All Channels'}
          </button>

          <button
            onClick={testTutorMapping}
            disabled={results.mappingTesting}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
          >
            {results.mappingTesting || 'Test Tutor Mapping'}
          </button>
        </div>

        <div className="space-y-6">
          {results.createResponse && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Channel Creation Response</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(results.createResponse, null, 2)}
              </pre>
            </div>
          )}

          {results.createError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Channel Creation Error</h3>
              <p className="text-red-600">{results.createError}</p>
            </div>
          )}

          {results.fetchResponse && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Channel Fetch Response</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(results.fetchResponse, null, 2)}
              </pre>
            </div>
          )}

          {results.fetchError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Channel Fetch Error</h3>
              <p className="text-red-600">{results.fetchError}</p>
            </div>
          )}

          {results.allChannelsResponse && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">All Channels Response</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(results.allChannelsResponse, null, 2)}
              </pre>
            </div>
          )}

          {results.allChannelsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">All Channels Error</h3>
              <p className="text-red-600">{results.allChannelsError}</p>
            </div>
          )}

          {results.mappingResponse && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Tutor Mapping Test Response</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(results.mappingResponse, null, 2)}
              </pre>
            </div>
          )}

          {results.mappingError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Tutor Mapping Error</h3>
              <p className="text-red-600">{results.mappingError}</p>
            </div>
          )}
        </div>

        <div className="mt-8">
          <a href="/channel-setup" className="text-blue-600 hover:underline mr-4">Go to Channel Setup</a>
          <a href="/channel" className="text-blue-600 hover:underline mr-4">Go to Channel View</a>
          <a href="/channels" className="text-blue-600 hover:underline mr-4">Go to Channels List</a>
          <a href="/Tutordashboard" className="text-blue-600 hover:underline">Go to Dashboard</a>
        </div>
      </div>
    </div>
  );
};

export default DebugChannel;
