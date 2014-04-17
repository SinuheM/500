window.Widgets.List = Backbone.View.extend({
	initialize : function (config) {
		var self = this;
		config = config || {};
		this.templateSelector = config.template;
		this.listItemTemplateSelector = config.itemTemplate;
		this.listItemTagName = config.itemTagName;
		this.listItemClassName = config.itemTagClassName;
		this.hideOnEmpty = config.hideOnEmpty;
		this.goTo = config.goTo;

		self.items = new Backbone.Collection();

		self.items.on('add', function(model){
			var row = new window.Widgets.List.ListItem({
				model: model,
				templateSelector : self.listItemTemplateSelector,
				tagName : self.listItemTagName || 'div',
				className : self.listItemClassName,
				goTo : self.goTo
			});
			row.render().$el.appendTo(self.$rowContainer);
		});

		self.template = _.template( $(this.templateSelector || '#listTemplate').text() );
	},
	empty : function () {
		this.$el.find('.list-container').html('loading...');
		this.items.reset();
		this.$el.show();
	},
	fill : function (data) {
		data = data || [];

		this.$el.find('.list-container').html('');
		this.items.add(data);

		if(this.hideOnEmpty && data.length === 0){
			this.$el.hide();
		}
	},
	render : function () {
		this.$el.html( this.template() );
		this.$rowContainer = this.$el.find('.list-container');

		return this;
	}
});

window.Widgets.List.ListItem = Backbone.View.extend({
	events : {
		'click' : 'goTo'
	},
	tagName : 'tr',
	initialize : function (config) {
		var self = this;
		config = config || {};
		this.templateSelector = config.templateSelector;

		self.template = _.template( $(this.templateSelector || '#listItemTemplate').text() );

		self.model.on('remove', function(){
			self.remove();
		});

		if(config.goTo){
			this.goTo = config.goTo
		}
	},
	goTo : function(){},
	render : function () {
		this.$el.html( this.template({ item: this.model.toJSON() }) );

		return this;
	}
});