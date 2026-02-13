(function () {
  const STORAGE_KEY = 'plusopinion_runtime';

  const defaultState = {
    posts: [],
    drafts: [],
    comments: {},
    notifications: [],
    user: {
      id: 'user_001',
      name: 'Aditya Gupta',
      username: 'adityagupta'
    },
    categories: {
      DEEP_DB: {},
      POPULAR_KEYS: [],
      GROWING_KEYS: [],
      ALL_KEYS: []
    }
  };

  const loadState = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : structuredClone(defaultState);
  };

  const saveState = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const state = loadState();

  const actions = {
    saveDraft(draft) {
      state.drafts.unshift({
        id: Date.now(),
        ...draft,
        createdAt: new Date().toISOString()
      });
      saveState();
      console.log('[Draft Saved]', state.drafts);
    },

    publishOpinion(post) {
      state.posts.unshift(post);
      saveState();
    }
  };

  window.PlusOpinion = { state, actions };
})();