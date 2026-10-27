import React, { useState, useEffect, useRef } from "react";
export default {
  saveDraft(draft) {
    console.log("Memory: Attempting to save draft...");

    // 1. Get existing drafts from the Runtime Storage Key if available
    // This mimics how `runtime.js` might operate if it were fully active
    const STORAGE_KEY = 'plusopinion_runtime';
    let state = {};
    try {
      const storedState = localStorage.getItem(STORAGE_KEY);
      if (storedState) {
        state = JSON.parse(storedState);
      } else {
        // Initialize if empty
        state = {
          drafts: []
        };
      }
    } catch (e) {
      console.error("Error reading runtime state", e);
    }

    // Ensure drafts array exists
    if (!state.drafts) state.drafts = [];

    // 2. Add new draft to the Runtime State
    // Note: Profile page likely reads from this specific structure based on `runtime.js`
    state.drafts.unshift(draft); // Add to beginning

    // 3. Save back to LocalStorage (Persistence)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.log("LocalStorage blocked");
    }

    // 4. ALSO save to a simple key as a fallback/redundancy
    // This covers cases where simple scripts check 'drafts' or 'plusopinion:drafts' directly
    let simpleDrafts = [];
    try {
      const sd = localStorage.getItem('plusopinion:drafts');
      if (sd) simpleDrafts = JSON.parse(sd);
      simpleDrafts.unshift(draft);
      localStorage.setItem('plusopinion:drafts', JSON.stringify(simpleDrafts));
    } catch (e) {}

    // 5. Update Global Window State (Immediate Access)
    // This is crucial for single-page-app feel where window isn't reloaded
    if (window.PlusOpinion && window.PlusOpinion.state) {
      if (!window.PlusOpinion.state.drafts) window.PlusOpinion.state.drafts = [];
      window.PlusOpinion.state.drafts.unshift(draft);
    }

    // 6. Dispatch Custom Event (The "Signal")
    // Profile page listens for 'plusopinion:draftSaved' to re-render
    window.dispatchEvent(new CustomEvent('plusopinion:draftSaved'));
    console.log("Draft Saved Successfully:", draft);
  }
};