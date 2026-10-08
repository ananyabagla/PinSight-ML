import React, { useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, MessageSquare, UploadCloud, LayoutDashboard } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function App() {
  const [data, setData] = useState([]);
  const [fileStatus, setFileStatus] = useState('No file uploaded yet.');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Upload a recommendation model metrics CSV to begin analysis.' }
  ]);
  const [loading, setLoading] = useState(false);
  
  const [visibleColumns, setVisibleColumns] = useState([]);
  // Updated to Pinterest-friendly warm/content colors
  const colors = ["#E60023", "#F59E0B", "#3B82F6", "#10B981", "#8B5CF6"];

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setFileStatus(`Uploading ${file.name}...`);

    try {
      await axios.post('https://pinsight-ml.onrender.com//api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFileStatus(`${file.name} loaded successfully.`);
      
      const res = await axios.get('https://pinsight-ml.onrender.com//api/telemetry');
      setData(res.data);
      
      if (res.data.length > 0) {
        const firstRow = res.data[0];
        const numericCols = Object.keys(firstRow).filter(k => k !== 'timestamp' && typeof firstRow[k] === 'number');
        setVisibleColumns(numericCols.slice(0, 2));
      }

      setChatHistory(prev => [...prev, { role: 'ai', text: 'Model data loaded. What engagement trends would you like to analyze?' }]);
    } catch (err) {
      setFileStatus(`Error uploading file: ${err.message}`);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput || data.length === 0) return;

    const userMessage = { role: 'user', text: chatInput };
    setChatHistory([...chatHistory, userMessage]);
    setChatInput('');
    setLoading(true);

    try {
      const response = await axios.post('https://pinsight-ml.onrender.com//api/chat', { query: userMessage.text });
      let aiText = response.data.response;

      const plotMatch = aiText.match(/\[PLOT:\s*(.+?)\]/i);
      if (plotMatch) {
        const cols = plotMatch[1].split(',').map(c => c.trim());
        setVisibleColumns(cols);
        aiText = aiText.replace(plotMatch[0], '').trim();
      }

      setChatHistory(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Error contacting AI agent. Is the backend running?' }]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 font-sans">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#E60023] p-2 rounded-full text-white">
            <TrendingUp size={24} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">PinSight ML Analyzer</h1>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-sm text-gray-500 font-medium">{fileStatus}</span>
          <label className="cursor-pointer bg-[#E60023] hover:bg-red-700 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-colors shadow-sm font-semibold text-sm">
            <UploadCloud size={18} />
            <span>Upload Metrics CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-md lg:sticky lg:top-8 self-start">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Ranking Model Performance</h2>
            <div className="flex gap-2 text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full items-center">
              <LayoutDashboard size={14}/> Agentic Layout
            </div>
          </div>
          
          {data.length > 0 ? (
            <div className="h-80 w-full text-sm font-medium">
              <ResponsiveContainer>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="timestamp" stroke="#6B7280" tick={{fontSize: 11}} tickFormatter={(tick) => tick ? String(tick).substring(11,16) : ''} axisLine={false} tickLine={false} dy={10} />
                  
                  <YAxis yAxisId="left" stroke="#6B7280" axisLine={false} tickLine={false} dx={-10} />
                  {visibleColumns.length > 1 && <YAxis yAxisId="right" orientation="right" stroke="#6B7280" axisLine={false} tickLine={false} dx={10} />}
                  
                  <Tooltip contentStyle={{backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}}/>
                  
                  {visibleColumns.map((col, idx) => (
                    <Line 
                      key={col} 
                      yAxisId={idx % 2 === 0 ? "left" : "right"} 
                      type="monotone" 
                      dataKey={col} 
                      stroke={colors[idx % colors.length]} 
                      strokeWidth={3}
                      dot={false} 
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      name={col.replace(/_/g, ' ')} 
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 font-medium">
              Upload A/B test results to visualize engagement.
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-md flex flex-col h-[600px] lg:h-[calc(100vh-140px)]">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
            <MessageSquare size={20} className="text-[#E60023]"/> 
            AI Diagnostics Agent
          </h2>
          
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-3 custom-scrollbar">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`p-4 rounded-2xl text-sm max-w-[90%] shadow-sm ${msg.role === 'user' ? 'bg-[#E60023] ml-auto text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm border border-gray-200'}`}>
                {msg.role === 'user' ? (
                  <span className="font-medium">{msg.text}</span>
                ) : (
                  <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-a:text-[#E60023] prose-td:border prose-td:border-gray-300 prose-th:border prose-th:border-gray-300 prose-th:bg-gray-200 prose-table:w-full prose-table:border-collapse prose-strong:text-gray-900 prose-headings:text-gray-900">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="text-gray-400 animate-pulse text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 bg-[#E60023] rounded-full"></div>
              Agent executing pandas dataframe logic...
            </div>}
          </div>

          <form onSubmit={handleChatSubmit} className="flex gap-3">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={data.length === 0}
              placeholder={data.length === 0 ? "Upload data first..." : "e.g., Did the new embedding model increase save rates?"} 
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-gray-800 font-medium focus:outline-none focus:border-[#E60023] focus:ring-1 focus:ring-[#E60023] disabled:opacity-50 transition-all shadow-inner"
            />
            <button type="submit" disabled={data.length === 0} className="bg-[#E60023] hover:bg-red-700 text-white px-6 py-3 rounded-full font-bold transition-all disabled:opacity-50 shadow-md hover:shadow-lg">
              Analyze
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}