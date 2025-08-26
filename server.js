const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://cdnjs.cloudflare.com"],
    },
  },
}));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Fractal processing functions that GPT can call
const fractalFunctions = [
  {
    name: "delegate_fractal_tasks",
    description: "Delegate complex tasks to multiple specialized agents in the fractal system",
    parameters: {
      type: "object",
      properties: {
        tasks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              subtask: {
                type: "string",
                description: "Specific subtask to delegate to a child agent"
              },
              focus: {
                type: "string", 
                description: "The specific aspect or angle this subtask should focus on"
              }
            },
            required: ["subtask", "focus"]
          },
          description: "Array of 1-8 subtasks to delegate to child agents"
        },
        reason: {
          type: "string",
          description: "Why this task needs to be broken down into subtasks"
        }
      },
      required: ["tasks", "reason"]
    }
  }
];

class FractalEngine {
  constructor() {
    this.sessions = new Map();
    this.executionTrees = new Map();
    this.executionLogs = new Map();
    this.activeExecutions = new Map(); // Track real-time execution
  }

  createSession(goal = "General AI assistance") {
    const sessionId = uuidv4();
    this.sessions.set(sessionId, { goal });
    return sessionId;
  }

  async processQuery(sessionId, query, maxDepth = 3, maxBranching = 3, modifier = 'flat', apiKey = null) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    console.log(`Processing query with max depth: ${maxDepth}, max branching: ${maxBranching}, modifier: ${modifier}`);
    
    // Create execution tree with all possible nodes (not just executed ones)
    const executionTree = this.createFullTree(maxDepth, maxBranching, modifier, query);
    this.executionTrees.set(sessionId, executionTree);

    // Initialize execution tracking
    const executionTracking = {
      sessionId,
      timestamp: new Date().toISOString(),
      query,
      maxDepth,
      maxBranching,
      totalPossibleAgents: this.calculateTotalAgents(maxDepth, maxBranching, modifier),
      executedAgents: 0,
      agents: [],
      fractalUsed: false,
      executionPath: [], // Track which nodes actually executed
      currentlyExecuting: null
    };
    
    this.executionLogs.set(sessionId, executionTracking);
    this.activeExecutions.set(sessionId, executionTracking);

    // Use provided API key or fallback to environment
    const openaiClient = apiKey ? new OpenAI({ apiKey }) : openai;

    // Start with root GPT agent
    const response = await this.executeRootAgent(
      query, session.goal, maxDepth, maxBranching, 
      executionTree, executionTracking, openaiClient
    );
    
    return {
      response: response,
      tree: executionTree,
      depth: maxDepth,
      length: maxBranching,
      executionLog: executionTracking.fractalUsed ? executionTracking : null,
      executedAgents: executionTracking.executedAgents,
      totalPossibleAgents: executionTracking.totalPossibleAgents
    };
  }

  createFullTree(maxDepth, maxBranching, modifier, rootQuery) {
    // Calculate the number of children for each layer based on modifier
    const layerChildCounts = this.calculateModifierChildCounts(maxDepth, maxBranching, modifier);
    
    const createNode = (layer, position, parentPath = []) => {
      const nodePath = [...parentPath, position];
      const childrenCount = layer < maxDepth - 1 ? layerChildCounts[layer + 1] : 0;
      
      return {
        id: uuidv4(),
        layer,
        position,
        path: nodePath,
        query: layer === 0 ? rootQuery : null,
        response: null,
        executed: false,
        currentlyExecuting: false,
        children: childrenCount > 0 ? 
          Array.from({ length: childrenCount }, (_, i) => 
            createNode(layer + 1, i, nodePath)
          ) : []
      };
    };

    return createNode(0, 0);
  }

  calculateTotalAgents(depth, branching, modifier = 'flat') {
    const layerCounts = this.calculateModifierLayerCounts(depth, branching, modifier);
    return layerCounts.reduce((sum, count) => sum + count, 0);
  }

  calculateModifierLayerCounts(depth, length, modifier) {
    const layerCounts = [];
    
    switch (modifier) {
      case 'flat':
        for (let layer = 0; layer < depth; layer++) {
          layerCounts.push(Math.pow(length, layer));
        }
        break;
        
      case 'subtract':
        // Starts at base length, decreases each layer to 1
        for (let layer = 0; layer < depth; layer++) {
          if (layer === 0) {
            layerCounts.push(1); // Root layer
          } else {
            const agentsInLayer = Math.max(1, Math.round(length - ((length - 1) * (layer - 1) / (depth - 2))));
            const parentCount = layerCounts[layer - 1];
            layerCounts.push(parentCount * agentsInLayer);
          }
        }
        break;
        
      case 'add':
        // Starts small, increases to base length in final layer
        for (let layer = 0; layer < depth; layer++) {
          if (layer === 0) {
            layerCounts.push(1); // Root layer
          } else {
            const agentsInLayer = Math.max(1, Math.round(1 + ((length - 1) * (layer - 1) / (depth - 2))));
            const parentCount = layerCounts[layer - 1];
            layerCounts.push(parentCount * agentsInLayer);
          }
        }
        break;
        
      case 'shrink_divided':
        // First layer = base length, each layer = base / layer number
        for (let layer = 0; layer < depth; layer++) {
          if (layer === 0) {
            layerCounts.push(1); // Root layer
          } else {
            const agentsInLayer = Math.max(1, Math.round(length / layer));
            const parentCount = layerCounts[layer - 1];
            layerCounts.push(parentCount * agentsInLayer);
          }
        }
        break;
        
      case 'grow_divided':
        // Opposite of shrink_divided, ending at base length
        for (let layer = 0; layer < depth; layer++) {
          if (layer === 0) {
            layerCounts.push(1); // Root layer
          } else {
            const reverseLayer = depth - layer;
            const agentsInLayer = layer === depth - 1 ? length : Math.max(1, Math.round(length / reverseLayer));
            const parentCount = layerCounts[layer - 1];
            layerCounts.push(parentCount * agentsInLayer);
          }
        }
        break;
        
      default:
        // Fallback to flat
        for (let layer = 0; layer < depth; layer++) {
          layerCounts.push(Math.pow(length, layer));
        }
    }
    
    return layerCounts;
  }

  calculateModifierChildCounts(depth, length, modifier) {
    const childCounts = [];
    
    switch (modifier) {
      case 'flat':
        for (let layer = 0; layer < depth; layer++) {
          childCounts.push(length);
        }
        break;
        
      case 'subtract':
        // Starts at base length, decreases each layer to 1
        for (let layer = 0; layer < depth; layer++) {
          if (layer === 0) {
            childCounts.push(length);
          } else {
            const agentsInLayer = Math.max(1, Math.round(length - ((length - 1) * (layer - 1) / (depth - 2))));
            childCounts.push(agentsInLayer);
          }
        }
        break;
        
      case 'add':
        // Starts small, increases to base length in final layer
        for (let layer = 0; layer < depth; layer++) {
          if (layer === 0) {
            const agentsInLayer = depth > 2 ? 1 : length;
            childCounts.push(agentsInLayer);
          } else {
            const agentsInLayer = Math.max(1, Math.round(1 + ((length - 1) * (layer - 1) / (depth - 2))));
            childCounts.push(agentsInLayer);
          }
        }
        break;
        
      case 'shrink_divided':
        // First layer = base length, each layer = base / layer number
        for (let layer = 0; layer < depth; layer++) {
          if (layer === 0) {
            childCounts.push(length);
          } else {
            const agentsInLayer = Math.max(1, Math.round(length / (layer + 1)));
            childCounts.push(agentsInLayer);
          }
        }
        break;
        
      case 'grow_divided':
        // Opposite of shrink_divided, ending at base length
        for (let layer = 0; layer < depth; layer++) {
          if (layer === depth - 1) {
            childCounts.push(0); // Last layer has no children
          } else {
            const reverseLayer = depth - layer - 1;
            const agentsInLayer = layer === depth - 2 ? length : Math.max(1, Math.round(length / reverseLayer));
            childCounts.push(agentsInLayer);
          }
        }
        break;
        
      default:
        // Fallback to flat
        for (let layer = 0; layer < depth; layer++) {
          childCounts.push(length);
        }
    }
    
    return childCounts;
  }

  async executeRootAgent(query, goal, maxDepth, maxBranching, treeNode, executionTracking, openaiClient) {
    try {
      // Mark this node as currently executing
      treeNode.currentlyExecuting = true;
      executionTracking.currentlyExecuting = treeNode.path;
      
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are the root agent of a fractal reasoning system. Your goal: ${goal}
            
You can either:
1. Answer simple queries directly
2. For complex queries, use the delegate_fractal_tasks function to break the task into subtasks for specialized agents

When delegating, create 1-${maxBranching} focused subtasks. The system has a max depth of ${maxDepth} layers.
Each subtask should be specific and focused on a different aspect of the problem.`
          },
          {
            role: "user", 
            content: query
          }
        ],
        functions: fractalFunctions,
        function_call: "auto",
        temperature: 0.7
      });

      const message = completion.choices[0].message;
      
      if (message.function_call && message.function_call.name === "delegate_fractal_tasks") {
        // Delegate to fractal system
        const args = JSON.parse(message.function_call.arguments);
        console.log(`Root agent delegating ${args.tasks.length} tasks: ${args.reason}`);
        
        // Mark as fractal execution and track execution
        executionTracking.fractalUsed = true;
        executionTracking.summary = `Root agent delegated to ${args.tasks.length} specialized agents: ${args.reason}`;
        
        // Mark root node as executed
        treeNode.executed = true;
        treeNode.currentlyExecuting = false;
        executionTracking.executedAgents++;
        executionTracking.executionPath.push(treeNode.path);
        
        // Log root agent
        executionTracking.agents.push({
          layer: 0,
          position: 0,
          type: 'root',
          path: treeNode.path,
          task: { subtask: query, focus: 'Main user query' },
          response: `Delegating to ${args.tasks.length} agents: ${args.reason}`,
          delegated: true
        });
        
        const childResults = await this.executeFractalLayer(
          args.tasks, goal, 1, maxDepth, maxBranching, treeNode, executionTracking, openaiClient
        );
        
        // Synthesize results back to user
        const finalResponse = await this.synthesizeResults(childResults, query, goal, executionTracking, openaiClient);
        treeNode.response = finalResponse;
        
        return finalResponse;
      } else {
        // Direct response - mark as executed
        const directResponse = message.content;
        treeNode.executed = true;
        treeNode.currentlyExecuting = false;
        treeNode.response = directResponse;
        executionTracking.executedAgents++;
        executionTracking.executionPath.push(treeNode.path);
        
        console.log("Root agent responding directly");
        return directResponse;
      }
      
    } catch (error) {
      console.error('Root agent error:', error);
      const errorResponse = `I encountered an error while processing your request: ${error.message}`;
      treeNode.response = errorResponse;
      return errorResponse;
    }
  }

  async executeFractalLayer(tasks, goal, currentLayer, maxDepth, maxBranching, parentNode, executionTracking, openaiClient) {
    console.log(`Executing layer ${currentLayer} with ${tasks.length} tasks`);
    
    const childPromises = tasks.slice(0, maxBranching).map(async (task, index) => {
      // Find the corresponding child node in the pre-built tree
      const childNode = parentNode.children[index];
      if (!childNode) {
        console.error(`Child node not found at layer ${currentLayer}, position ${index}`);
        return null;
      }
      
      // Update node with task information
      childNode.query = task.subtask;
      childNode.focus = task.focus;
      
      if (currentLayer >= maxDepth - 1) {
        // Leaf agent - execute directly
        const response = await this.executeLeafAgent(task, goal, childNode, executionTracking, openaiClient);
        return response;
      } else {
        // Intermediate agent - can delegate further
        const response = await this.executeIntermediateAgent(
          task, goal, currentLayer, maxDepth, maxBranching, childNode, executionTracking, openaiClient
        );
        return response;
      }
    });

    return Promise.all(childPromises);
  }

  async executeLeafAgent(task, goal, treeNode, executionTracking, openaiClient) {
    try {
      console.log(`Leaf agent executing: ${task.subtask}`);
      
      // Mark as currently executing
      treeNode.currentlyExecuting = true;
      executionTracking.currentlyExecuting = treeNode.path;
      
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o", 
        messages: [
          {
            role: "system",
            content: `You are a leaf agent in a fractal reasoning system. Goal: ${goal}
            
Execute this specific subtask directly and provide a focused, detailed response.
Focus: ${task.focus}

Provide concrete, actionable insights that will be valuable when synthesized with other agents' work.`
          },
          {
            role: "user",
            content: task.subtask
          }
        ],
        temperature: 0.7
      });

      const response = completion.choices[0].message.content;
      treeNode.response = response;
      
      // Mark as executed
      treeNode.executed = true;
      treeNode.currentlyExecuting = false;
      executionTracking.executedAgents++;
      executionTracking.executionPath.push(treeNode.path);
      
      console.log(`Leaf agent completed task`);
      
      // Log leaf agent execution
      executionTracking.agents.push({
        layer: treeNode.layer,
        position: treeNode.position,
        type: 'leaf',
        path: treeNode.path,
        task: task,
        response: response,
        delegated: false
      });
      
      return {
        subtask: task.subtask,
        focus: task.focus,
        result: response,
        layer: treeNode.layer,
        position: treeNode.position
      };
      
    } catch (error) {
      console.error('Leaf agent error:', error);
      const errorResult = {
        subtask: task.subtask,
        focus: task.focus,
        result: `Error executing subtask: ${error.message}`,
        layer: treeNode.layer,
        position: treeNode.position
      };
      treeNode.response = errorResult.result;
      return errorResult;
    }
  }

  async executeIntermediateAgent(task, goal, currentLayer, maxDepth, maxBranching, treeNode, executionLog) {
    try {
      console.log(`Intermediate agent at layer ${currentLayer} executing: ${task.subtask}`);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system", 
            content: `You are an intermediate agent in a fractal reasoning system at layer ${currentLayer}/${maxDepth}. Goal: ${goal}
            
You can either:
1. Handle this subtask directly if it's straightforward
2. Use delegate_fractal_tasks to break it into ${maxBranching} more specific subtasks

Focus: ${task.focus}
Current layer: ${currentLayer}, Max depth: ${maxDepth}`
          },
          {
            role: "user",
            content: task.subtask
          }
        ],
        functions: fractalFunctions,
        function_call: "auto", 
        temperature: 0.7
      });

      const message = completion.choices[0].message;
      
      if (message.function_call && message.function_call.name === "delegate_fractal_tasks") {
        // Delegate further
        const args = JSON.parse(message.function_call.arguments);
        console.log(`Intermediate agent delegating ${args.tasks.length} subtasks`);
        
        const childResults = await this.executeFractalLayer(
          args.tasks, goal, currentLayer + 1, maxDepth, maxBranching, treeNode, executionLog
        );
        
        // Synthesize child results  
        const synthesizedResult = await this.synthesizeResults(childResults, task.subtask, goal, executionLog);
        treeNode.response = synthesizedResult;
        
        // Log intermediate agent
        executionLog.agents.push({
          layer: currentLayer,
          position: treeNode.position,
          type: 'intermediate',
          task: task,
          response: synthesizedResult,
          delegated: true
        });
        
        return {
          subtask: task.subtask,
          focus: task.focus, 
          result: synthesizedResult,
          layer: currentLayer,
          position: treeNode.position
        };
      } else {
        // Direct response
        const directResult = message.content;
        treeNode.response = directResult;
        console.log(`Intermediate agent responding directly`);
        
        return {
          subtask: task.subtask,
          focus: task.focus,
          result: directResult,
          layer: currentLayer,
          position: treeNode.position
        };
      }
      
    } catch (error) {
      console.error('Intermediate agent error:', error);
      const errorResult = {
        subtask: task.subtask,
        focus: task.focus,
        result: `Error in intermediate processing: ${error.message}`,
        layer: currentLayer,
        position: treeNode.position
      };
      treeNode.response = errorResult.result;
      return errorResult;
    }
  }

  async synthesizeResults(childResults, originalQuery, goal, executionLog = null) {
    try {
      console.log(`Synthesizing ${childResults.length} results`);
      
      const resultsText = childResults.map(r => 
        `Subtask: ${r.subtask}\nFocus: ${r.focus}\nResult: ${r.result}`
      ).join('\n\n');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are synthesizing results from ${childResults.length} specialized agents. Goal: ${goal}
            
Combine their findings into a coherent, comprehensive response to the original query.
Focus on integrating insights, identifying patterns, and providing a unified answer.`
          },
          {
            role: "user", 
            content: `Original query: ${originalQuery}\n\nAgent results:\n${resultsText}\n\nSynthesize these into a comprehensive response.`
          }
        ],
        temperature: 0.6
      });

      const synthesis = completion.choices[0].message.content;
      console.log("Synthesis completed");
      return synthesis;
      
    } catch (error) {
      console.error('Synthesis error:', error);
      return `Error synthesizing results: ${error.message}. Here are the individual results:\n\n${childResults.map(r => r.result).join('\n\n')}`;
    }
  }
}

const engine = new FractalEngine();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/session', (req, res) => {
  const { goal } = req.body;
  const sessionId = engine.createSession(goal);
  res.json({ sessionId });
});

app.post('/api/query', async (req, res) => {
  try {
    const { sessionId, query, depth = 3, length = 3, modifier = 'flat', apiKey = null } = req.body;
    const result = await engine.processQuery(sessionId, query, depth, length, modifier, apiKey);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// New endpoint for real-time execution status
app.get('/api/execution/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const execution = engine.activeExecutions.get(sessionId);
    
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }
    
    res.json({
      currentlyExecuting: execution.currentlyExecuting,
      executedAgents: execution.executedAgents,
      totalPossibleAgents: execution.totalPossibleAgents,
      executionPath: execution.executionPath
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Fractal Engine running on port ${PORT}`);
});

module.exports = app;