// Bridge stub — safely defines the global Bridge object if no other implementation exists
window.Bridge = window.Bridge || {
  registerPage: function () { },
  emit: function () { },
  on: function () { }
};

Bridge.registerPage({
  page: 'homepage',
  features: ['feed', 'lens', 'composer']
});
