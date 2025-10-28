/**
 * Global Gate Manager
 * Prevents multiple gates from showing simultaneously
 */

interface GateState {
  id: string;
  isShowing: boolean;
  priority: number; // Lower number = higher priority
}

class GateManager {
  private static instance: GateManager;
  private activeGates: Map<string, GateState> = new Map();
  private listeners: Map<string, (isShowing: boolean) => void> = new Map();

  private constructor() {}

  static getInstance(): GateManager {
    if (!GateManager.instance) {
      GateManager.instance = new GateManager();
    }
    return GateManager.instance;
  }

  /**
   * Register a gate with the manager
   */
  registerGate(gateId: string, priority: number = 100): void {
    console.log(`[GATE MANAGER] Registering gate ${gateId} with priority ${priority}`);
    this.activeGates.set(gateId, {
      id: gateId,
      isShowing: false,
      priority,
    });
  }

  /**
   * Request to show a gate - will hide others if this has higher priority
   */
  requestShowGate(gateId: string): boolean {
    const gate = this.activeGates.get(gateId);
    if (!gate) {
      console.warn(`[GATE MANAGER] Gate ${gateId} not registered`);
      return false;
    }

    console.log(`[GATE MANAGER] Request to show gate ${gateId} (priority: ${gate.priority})`);

    // Check if any other gate is currently showing
    const currentlyShowing = Array.from(this.activeGates.values()).find(
      g => g.isShowing && g.id !== gateId
    );

    if (currentlyShowing) {
      // If this gate has higher priority (lower number), hide the current one
      if (gate.priority < currentlyShowing.priority) {
        console.log(`[GATE MANAGER] Hiding gate ${currentlyShowing.id} to show ${gateId}`);
        this.hideGate(currentlyShowing.id);
      } else {
        console.log(`[GATE MANAGER] Gate ${gateId} blocked by higher priority gate ${currentlyShowing.id}`);
        return false;
      }
    }

    // Show this gate
    gate.isShowing = true;
    this.activeGates.set(gateId, gate);
    
    const listener = this.listeners.get(gateId);
    if (listener) {
      listener(true);
    }

    console.log(`[GATE MANAGER] Gate ${gateId} is now showing`);
    return true;
  }

  /**
   * Hide a gate
   */
  hideGate(gateId: string): void {
    const gate = this.activeGates.get(gateId);
    if (gate) {
      gate.isShowing = false;
      this.activeGates.set(gateId, gate);
      
      const listener = this.listeners.get(gateId);
      if (listener) {
        listener(false);
      }

      console.log(`[GATE MANAGER] Gate ${gateId} hidden`);
    }
  }

  /**
   * Register a listener for gate state changes
   */
  addListener(gateId: string, callback: (isShowing: boolean) => void): () => void {
    this.listeners.set(gateId, callback);
    
    // Return cleanup function
    return () => {
      this.listeners.delete(gateId);
    };
  }

  /**
   * Check if a gate can be shown (no higher priority gates active)
   */
  canShowGate(gateId: string): boolean {
    const gate = this.activeGates.get(gateId);
    if (!gate) return false;

    const currentlyShowing = Array.from(this.activeGates.values()).find(
      g => g.isShowing && g.id !== gateId
    );

    if (!currentlyShowing) return true;
    
    return gate.priority < currentlyShowing.priority;
  }

  /**
   * Get current state for debugging
   */
  getState(): { activeGates: GateState[]; listeners: string[] } {
    return {
      activeGates: Array.from(this.activeGates.values()),
      listeners: Array.from(this.listeners.keys()),
    };
  }
}

export default GateManager.getInstance();
