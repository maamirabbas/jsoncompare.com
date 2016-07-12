import MK from 'matreshka';
import CodeMirror from 'codemirror';

export default class BatchItem extends MK.Object {
	constructor(...args) {
		super(...args);
		this.jset({
			value: this.value || ''
		});
	}

	onRender() {
		setTimeout(() => {
			this.editor = new CodeMirror(this.sandbox);

			this
				.bindNode({
					deleteButton: '<span class="delete-editor" title="Delete"></span>',
					value: this.editor.display.wrapper
				})
				.appendNode('deleteButton', ':sandbox .CodeMirror')
				.trigger('initialize', this);
		});
	}
}
