/*global _, beforeEach, describe, expect, it, jasmine, spyOn, MAPJS*/
describe('MapModel', function () {
	'use strict';
	it('should be able to instantiate MapModel', function () {
		var layoutCalculator,
			underTest = new MAPJS.MapModel(layoutCalculator);
		expect(underTest).not.toBeUndefined();
	});
	it('should dispatch inputEnabledChanged event when input is disabled', function () {
		var underTest = new MAPJS.MapModel(),
			inputEnabledChangedListener = jasmine.createSpy();
		underTest.addEventListener('inputEnabledChanged', inputEnabledChangedListener);

		underTest.setInputEnabled(false);

		expect(inputEnabledChangedListener).toHaveBeenCalledWith(false, false);
	});
	it('should dispatch inputEnabledChanged event when input is re-enabled, passing holdFocus argument if supplied', function () {
		var underTest = new MAPJS.MapModel(),
			inputEnabledChangedListener = jasmine.createSpy();
		underTest.setInputEnabled(false);
		underTest.addEventListener('inputEnabledChanged', inputEnabledChangedListener);
		underTest.setInputEnabled(true, true);
		expect(inputEnabledChangedListener).toHaveBeenCalledWith(true, true);
	});
	describe('events dispatched by MapModel when idea/layout is changed', function () {
		var underTest,
			anIdea,
			layoutBefore,
			layoutAfter,
			mapViewResetRequestedListener,
			layoutCalculatorLayout;
		beforeEach(function () {
			var layoutCalculator = function () {
					return layoutCalculatorLayout;
				};
			layoutBefore = {
				nodes: {
					1: {
						x: 10,
						y: 20,
						title: 'This node will be removed'
					},
					2: {
						x: 50,
						y: 20,
						title: 'second'
					},
					9: {
						x: 100,
						y: 100,
						title: 'style change',
						attr: {style: {prop: 'old val'}}
					}
				},
				links: {
					'2_9': {
						ideaIdFrom: 2,
						ideaIdTo: 9,
						attr: {
							style: {
								prop: 'old val'
							}
						}
					}
				}
			};
			layoutAfter = {
				nodes: {
					2: {
						x: 49,
						y: 20,
						title: 'This node will be moved'
					},
					3: {
						x: 100,
						y: 200,
						title: 'This node will be created',
						attr: {
							attachment: 'hello'
						}
					},
					9: {
						x: 100,
						y: 100,
						title: 'style change',
						attr: {style: {prop: 'new val'}}
					}
				},
				links: {
					'2_9': {
						ideaIdFrom: 2,
						ideaIdTo: 9,
						attr: {
							style: {
								prop: 'new val'
							}
						}
					}
				}
			};
			mapViewResetRequestedListener = jasmine.createSpy('mapViewResetRequestedListener');
			underTest = new MAPJS.MapModel(layoutCalculator, ['this will have all text selected']);
			underTest.addEventListener('mapViewResetRequested', mapViewResetRequestedListener);
			layoutCalculatorLayout = layoutBefore;
			anIdea = MAPJS.content({
				id: 4,
				title: 'this will have all text selected',
				ideas: {
					100: {
						id: 5,
						title: 'this will too'
					},
					101: {
						id: 6,
						title: 'this will have all text selected'
					}
				}
			});
			underTest.setIdea(anIdea);

			layoutCalculatorLayout = layoutAfter;
		});
		it('should dispatch a mapViewResetRequested event when an idea is set', function () {
			expect(mapViewResetRequestedListener).toHaveBeenCalled();
		});
		it('should dispatch nodeCreated event when a node is created because idea is changed', function () {
			var nodeCreatedListener = jasmine.createSpy();
			underTest.addEventListener('nodeCreated', nodeCreatedListener);

			anIdea.dispatchEvent('changed', 'updateTitle', ['arg'], 'sessionId');

			expect(nodeCreatedListener).toHaveBeenCalledWith(layoutAfter.nodes[3], 'sessionId');
		});
		it('should dispatch nodeMoved event when a node is moved because idea is changed', function () {
			var nodeMovedListener = jasmine.createSpy();
			underTest.addEventListener('nodeMoved', nodeMovedListener);

			anIdea.dispatchEvent('changed');

			expect(nodeMovedListener).toHaveBeenCalledWith(layoutAfter.nodes[2], undefined);
		});
		it('should dispatch nodeAttrChanged event when a node width changes', function () {
			var nodeMovedListener = jasmine.createSpy('nodeMoved'),
				nodeAttrChangedListener = jasmine.createSpy('nodeAttrChanged');
			layoutAfter.nodes[2] = _.extend({}, layoutBefore.nodes[2]);
			layoutAfter.nodes[2].width = 100;
			underTest.addEventListener('nodeMoved', nodeMovedListener);
			underTest.addEventListener('nodeAttrChanged', nodeAttrChangedListener);

			anIdea.dispatchEvent('changed');

			expect(nodeMovedListener).not.toHaveBeenCalled();
			expect(nodeAttrChangedListener).toHaveBeenCalledWith(layoutAfter.nodes[2], undefined);
		});
		it('should dispatch nodeAttrChanged event when a node height changes', function () {
			var nodeMovedListener = jasmine.createSpy('nodeMoved'),
				nodeAttrChangedListener = jasmine.createSpy('nodeAttrChanged');
			layoutAfter.nodes[2] = _.extend({}, layoutBefore.nodes[2]);
			layoutAfter.nodes[2].height = 100;
			underTest.addEventListener('nodeMoved', nodeMovedListener);
			underTest.addEventListener('nodeAttrChanged', nodeAttrChangedListener);

			anIdea.dispatchEvent('changed');

			expect(nodeMovedListener).not.toHaveBeenCalled();
			expect(nodeAttrChangedListener).toHaveBeenCalledWith(layoutAfter.nodes[2], undefined);
		});
		it('should dispatch nodeRemoved event when a node is removed because idea is changed', function () {
			var nodeRemovedListener = jasmine.createSpy();
			underTest.addEventListener('nodeRemoved', nodeRemovedListener);

			anIdea.dispatchEvent('changed');

			expect(nodeRemovedListener).toHaveBeenCalledWith(layoutBefore.nodes[1], '1', undefined);
		});
		it('should dispatch themeChanged when the theme changes', function () {

			var listener = jasmine.createSpy('themeChanged');
			underTest.addEventListener('themeChanged', listener);
			layoutAfter.theme = 'new-theme';
			anIdea.updateAttr(anIdea.id, 'theme', 'new-theme');
			expect(listener).toHaveBeenCalledWith('new-theme');
		});
		describe('decorationAction', function () {
			it('should dispatch decorationActionRequested', function () {
				var listener = jasmine.createSpy();
				underTest.addEventListener('decorationActionRequested', listener);
				anIdea.dispatchEvent('changed');

				underTest.decorationAction('source', 3, 'note');

				expect(listener).toHaveBeenCalledWith(3, 'note');
			});
		});
		describe('openAttachment', function () {
			it('should dispatch attachmentOpened event when openAttachment is invoked', function () {
				var attachmentOpenedListener = jasmine.createSpy();
				underTest.addEventListener('attachmentOpened', attachmentOpenedListener);
				anIdea.dispatchEvent('changed');

				underTest.openAttachment('source', 3);

				expect(attachmentOpenedListener).toHaveBeenCalledWith(3, 'hello');
			});
			it('should use currently selected node if no node id specified', function () {
				var attachmentOpenedListener = jasmine.createSpy();
				underTest.addEventListener('attachmentOpened', attachmentOpenedListener);
				underTest.selectNode(3);
				anIdea.dispatchEvent('changed');

				underTest.openAttachment('source');

				expect(attachmentOpenedListener).toHaveBeenCalledWith(3, 'hello');
			});
		});
		describe('editNode', function () {
			it('should dispatch nodeEditRequested when a request to edit node is made', function () {
				var nodeEditRequestedListener = jasmine.createSpy();
				underTest.addEventListener('nodeEditRequested', nodeEditRequestedListener);
				underTest.selectNode(1);

				underTest.editNode('toolbar', true);

				expect(nodeEditRequestedListener).toHaveBeenCalledWith(1, true, false);
			});
			it('should not dispatch nodeEditRequested when input is disabled', function () {
				var nodeEditRequestedListener = jasmine.createSpy();
				underTest.addEventListener('nodeEditRequested', nodeEditRequestedListener);
				underTest.selectNode(anIdea.id);
				underTest.setInputEnabled(false);
				underTest.editNode('toolbar', true);
				expect(nodeEditRequestedListener).not.toHaveBeenCalled();
			});
			it('should not dispatch nodeEditRequested when node is contentLocked', function () {
				var nodeEditRequestedListener = jasmine.createSpy();
				underTest.addEventListener('nodeEditRequested', nodeEditRequestedListener);
				anIdea.updateAttr(anIdea.id, 'contentLocked', true);
				underTest.selectNode(anIdea.id);
				underTest.editNode('toolbar', true);
				expect(nodeEditRequestedListener).not.toHaveBeenCalled();
			});
			it('should select all text when the current text of root node is one of our defaults', function () {
				var nodeEditRequestedListener = jasmine.createSpy();
				underTest.addEventListener('nodeEditRequested', nodeEditRequestedListener);
				underTest.selectNode(4);

				underTest.editNode('toolbar', false);

				expect(nodeEditRequestedListener).toHaveBeenCalledWith(4, true, false);
			});
			it('should select all text when the current text of child node is one of our defaults', function () {
				var nodeEditRequestedListener = jasmine.createSpy();
				underTest.addEventListener('nodeEditRequested', nodeEditRequestedListener);
				underTest.selectNode(6);

				underTest.editNode('toolbar', false);

				expect(nodeEditRequestedListener).toHaveBeenCalledWith(6, true, false);
			});
		});
		it('should dispatch nodeAttrChanged the style changes is created', function () {
			var nodeAttrChangedListener = jasmine.createSpy();
			underTest.addEventListener('nodeAttrChanged', nodeAttrChangedListener);
			anIdea.dispatchEvent('changed');
			expect(nodeAttrChangedListener).toHaveBeenCalledWith(layoutAfter.nodes[9], undefined);
		});
		it('should dispatch linkAttrChanged the style changes is created', function () {
			var linkAttrChangedListener = jasmine.createSpy();
			underTest.addEventListener('linkAttrChanged', linkAttrChangedListener);

			anIdea.dispatchEvent('changed');

			expect(linkAttrChangedListener).toHaveBeenCalledWith(layoutAfter.links['2_9'], undefined);
		});
		describe('automatic UI actions', function () {
			var nodeEditRequestedListener, nodeSelectionChangedListener, activatedNodesChangedListener;
			beforeEach(function () {
				nodeEditRequestedListener = jasmine.createSpy();
				nodeSelectionChangedListener = jasmine.createSpy();
				activatedNodesChangedListener = jasmine.createSpy();
				anIdea = MAPJS.content({
					id: 1,
					ideas: {
						7: {
							id: 2
						},
						8: {
							id: 3
						}
					}
				});
				underTest.setIdea(anIdea);
				underTest.addEventListener('nodeEditRequested', nodeEditRequestedListener);
				underTest.selectNode(2);
				underTest.activateNode('test', 3);
				underTest.addEventListener('nodeSelectionChanged', nodeSelectionChangedListener);
				underTest.addEventListener('activatedNodesChanged', activatedNodesChangedListener);
			});
			_.each(['addSubIdea', 'insertIntermediate', 'addSiblingIdea', 'addSiblingIdeaBefore'], function (command) {
				it('should dispatch edit after ' + command + ' from mapModel', function () {
					underTest[command]('source');
					expect(nodeEditRequestedListener).toHaveBeenCalledWith(4, true, true);
				});
				it('should return selection to previous on undo after ' + command, function () {
					underTest[command]('source');
					nodeSelectionChangedListener.calls.reset();
					underTest.undo();
					expect(nodeSelectionChangedListener).toHaveBeenCalledWith(2, true);
				});
				it('should return multi-activation to previous on undo after ' + command, function () {
					underTest[command]('source');
					activatedNodesChangedListener.calls.reset();
					underTest.undo();
					expect(activatedNodesChangedListener).toHaveBeenCalledWith([2], [4]);
					expect(activatedNodesChangedListener).toHaveBeenCalledWith([3], []);
				});
			});
			it('should deactivate nodes that are removed', function () {
				layoutCalculatorLayout = JSON.parse(JSON.stringify(layoutCalculatorLayout));
				delete layoutCalculatorLayout.nodes[3];
				anIdea.removeSubIdea(3);
				expect(underTest.getActivatedNodeIds()).toEqual([2]);
			});
			it('should activate the selected node if there are no more active nodes', function () {
				underTest.selectNode(1);
				underTest.activateChildren();
				layoutCalculatorLayout = JSON.parse(JSON.stringify(layoutCalculatorLayout));
				delete layoutCalculatorLayout.nodes[3];
				delete layoutCalculatorLayout.nodes[2];
				anIdea.removeSubIdea(2);
				expect(underTest.getActivatedNodeIds()).toEqual([1]);
			});
			describe('when the currently selected node is removed in a multi-root map', function () {
				beforeEach(function () {
					anIdea = MAPJS.content({
						formatVersion: 3,
						id: 'root',
						ideas: {
							1: {
								id: 1,
								ideas: {
									7: {
										id: 2
									},
									8: {
										id: 3
									}
								}
							},
							5: {
								id: 5,
								ideas: {
									6: {
										id: 6
									},
									7: {
										id: 7
									}
								}
							}
						}
					});
					layoutBefore = {
						nodes: {
							1: { x: 49, y: 20, title: '1', id: 1, rootId: 1 },
							2: { x: 49, y: 20, title: '2', id: 2, rootId: 1 },
							3: { x: 49, y: 20, title: '3', id: 3, rootId: 1 },
							5: { x: 49, y: 20, title: '5', id: 5, rootId: 5 },
							6: { x: 49, y: 20, title: '6', id: 6, rootId: 5 },
							7: { x: 49, y: 20, title: '7', id: 7, rootId: 5 }
						}
					};
					layoutCalculatorLayout = layoutBefore;
					underTest.setIdea(anIdea);
					underTest.selectNode(6);
					nodeSelectionChangedListener.calls.reset();
				});
				it('when the currently selected node is removed, selects its root if still in layout', function () {
					layoutCalculatorLayout = {
						nodes: {
							1: { x: 49, y: 20, title: '1', id: 1, rootId: 1 },
							2: { x: 49, y: 20, title: '2', id: 2, rootId: 1 },
							3: { x: 49, y: 20, title: '3', id: 3, rootId: 1 },
							5: { x: 49, y: 20, title: '5', id: 5, rootId: 5 },
							7: { x: 49, y: 20, title: '7', id: 7, rootId: 5 }
						}
					};
					anIdea.removeSubIdea(6);
					expect(nodeSelectionChangedListener).toHaveBeenCalledWith(6, false);
					expect(nodeSelectionChangedListener).toHaveBeenCalledWith(5, true);
				});
				it('when the currently selected node is removed, selects default root if direct root is no longer in layout', function () {
					layoutCalculatorLayout = {
						nodes: {
							1: { x: 49, y: 20, title: '1', id: 1, rootId: 1 },
							2: { x: 49, y: 20, title: '2', id: 2, rootId: 1 },
							3: { x: 49, y: 20, title: '3', id: 3, rootId: 1 }
						}
					};
					anIdea.removeSubIdea(6);
					expect(nodeSelectionChangedListener).toHaveBeenCalledWith(6, false);
					expect(nodeSelectionChangedListener).toHaveBeenCalledWith(1, true);
				});
			});

		});
		describe('focus/edit automatic control', function () {
			var nodeEditRequestedListener,
				nodeMovedListener,
				nodeSelectionChangedListener;
			beforeEach(function () {
				nodeMovedListener = jasmine.createSpy();
				nodeEditRequestedListener = jasmine.createSpy();
				nodeSelectionChangedListener = jasmine.createSpy();
			});
			describe('automatic positioning', function () {
				it('moves the map to keep selected node in the same position on the screen when updating attributes', function () {
					var layoutCalculatorLayout,
						layoutCalculator = function () {
							return layoutCalculatorLayout;
						},
						layoutBefore = {
							nodes: {
								1: {
									x: 100,
									y: 200,
									title: 'First'
								},
								2: {
									x: 0,
									y: 0,
									title: 'Second'
								}
							}
						},
						layoutAfter = {
							nodes: {
								1: {
									x: 110,
									y: 220,
									title: 'First'
								},
								2: {
									x: 0,
									y: 0,
									title: 'Second'
								}
							}
						},
						anIdea = MAPJS.content({title: 'ttt', attr: { collapsed: true}}),
						underTest = new MAPJS.MapModel(layoutCalculator),
						calls  = []; /* can't use a spy because args are passed by ref, so test can't check for canges in the same object*/
					layoutCalculatorLayout = layoutBefore;
					underTest.setIdea(anIdea);
					underTest.selectNode(1);
					underTest.addEventListener('nodeMoved', function (node) {
						calls.push(_.clone(node));
					});

					layoutCalculatorLayout = layoutAfter;
					underTest.collapse('test', false);

					expect(calls).toEqual([
						{
							x: 110,
							y: 220,
							title: 'First'
						}, {
							x: 100,
							y: 200,
							title: 'First'
						}, {
							x: -10,
							y: -20,
							title: 'Second'
						}
					]);
				});
			});

		});
	});
	describe('methods delegating to idea', function () {
		var anIdea, underTest, clipboard;
		beforeEach(function () {
			anIdea = MAPJS.content({
				id: 1,
				title: 'root',
				ideas: {
					10: {
						id: 2,
						title: 'child'
					}
				}
			});
			clipboard = jasmine.createSpyObj('clipboard', ['get', 'put']);
			underTest = new MAPJS.MapModel(function () {
				return {
					nodes: {2: {attr: {style: {styleprop: 'oldValue'}}}}
				};
			}, [], clipboard);
			underTest.setIdea(anIdea);
		});
		describe('flip', function () {
			beforeEach(function () {
				anIdea = MAPJS.content({
					id: 1,
					title: 'root',
					ideas: {
						10: {
							id: 2,
							title: 'child',
							ideas: {
								11: { id: 3, title: 'child of child' }
							}
						}
					}
				});
				underTest = new MAPJS.MapModel(function () {
					return {
						nodes: {1: {level: 1}, 2: {level: 2}, 3: {level: 3}}
					};
				}, [], clipboard);
				underTest.setIdea(anIdea);
				spyOn(anIdea, 'flip');
			});
			it('cannot flip the root node', function () {
				var result = underTest.flip();
				expect(result).toBeFalsy();
				expect(anIdea.flip).not.toHaveBeenCalled();
			});
			it('attempts to flip level = 2', function () {
				var result;
				underTest.selectNode(2);
				result = underTest.flip();
				expect(result).toBeFalsy();
				expect(anIdea.flip).toHaveBeenCalledWith(2);
			});
			it('cannot flip level > 2', function () {
				var result;
				underTest.selectNode(3);
				result = underTest.flip();
				expect(result).toBeFalsy();
				expect(anIdea.flip).not.toHaveBeenCalled();
			});
			it('does not die on unexisting node', function () {
				var result;
				underTest.selectNode(223);
				result = underTest.flip();
				expect(result).toBeFalsy();
				expect(anIdea.flip).not.toHaveBeenCalled();
			});
		});
		describe('updateTitle', function () {
			beforeEach(function () {
				spyOn(anIdea, 'updateTitle');
				spyOn(anIdea, 'initialiseTitle');
				underTest.selectNode(123);
			});
			it('should invoke idea.updateTitle with the arguments', function () {
				underTest.updateTitle(123, 'abc');
				expect(anIdea.updateTitle).toHaveBeenCalledWith(123, 'abc');
			});
			it('should invoke initialiseTitle if editNew is true', function () {
				underTest.updateTitle(123, 'abc', true);
				expect(anIdea.initialiseTitle).toHaveBeenCalledWith(123, 'abc');
			});
			it('should work even if input is disabled', function () {
				underTest.setInputEnabled(false);
				underTest.updateTitle(123, 'abc');
				expect(anIdea.updateTitle).toHaveBeenCalledWith(123, 'abc');
			});
		});
		describe('addSubIdea', function () {
			beforeEach(function () {
				spyOn(anIdea, 'addSubIdea').and.callThrough();
				underTest.selectNode(1);
			});
			it('should invoke idea.addSubIdea with currently selected idea as parentId', function () {
				underTest.addSubIdea();
				expect(anIdea.addSubIdea).toHaveBeenCalledWith(1);
			});
			it('should invoke idea.addSubIdea with argument idea as parentId if provided', function () {
				underTest.addSubIdea('source', 555);
				expect(anIdea.addSubIdea).toHaveBeenCalledWith(555);
			});
			it('should not invoke idea.addSubIdea when input is disabled', function () {
				underTest.setInputEnabled(false);
				underTest.addSubIdea();
				expect(anIdea.addSubIdea).not.toHaveBeenCalled();
			});
			it('should expand the node when addSubIdea is called, as a batched event', function () {
				underTest.selectNode(1);
				underTest.collapse('source', true);
				spyOn(anIdea, 'updateAttr').and.callThrough();
				spyOn(anIdea, 'dispatchEvent');
				underTest.addSubIdea();
				expect(anIdea.updateAttr).toHaveBeenCalledWith(1, 'collapsed', false);
				expect(anIdea.dispatchEvent.calls.count()).toBe(1);
			});
			it('should add with a title and select but not invoke editNode if title is supplied', function () {
				var nodeEditRequestedListener = jasmine.createSpy('node edit requested');
				underTest.addEventListener('nodeEditRequested', nodeEditRequestedListener);
				underTest.addSubIdea('source', 2, 'initial title');
				expect(anIdea.addSubIdea).toHaveBeenCalledWith(2, 'initial title');
				expect(nodeEditRequestedListener).not.toHaveBeenCalled();
				expect(underTest.getSelectedNodeId()).toBe(3);
			});
		});
		describe('insertIntermediateGroup', function () {
			describe('when a node is selected', function () {
				beforeEach(function () {
					underTest = new MAPJS.MapModel(
						function () {
							return {};
						},
						['What', 'a', 'beautiful', 'idea!']
					);
					underTest.setIdea(anIdea);
					spyOn(Math, 'random').and.returnValue(0.6);
					underTest.selectNode(2);
					spyOn(anIdea, 'insertIntermediateMultiple');
				});

				it('should invoke idea.insertIntermediate with the id of the selected node', function () {
					underTest.insertIntermediateGroup();
					expect(anIdea.insertIntermediateMultiple).toHaveBeenCalledWith([2], {title: 'group', attr: { group: true, contentLocked: true}});
				});
				it('should invoke idea.insertIntermediate with the ids of all active nodes of the selected node', function () {
					underTest.activateNode('test', 3);
					underTest.insertIntermediateGroup();
					expect(anIdea.insertIntermediateMultiple).toHaveBeenCalledWith([2, 3], {title: 'group', attr: { group: true, contentLocked: true}});
				});

				it('should not invoke anything if input is disabled', function () {
					underTest.setInputEnabled(false);
					underTest.insertIntermediateGroup();
					expect(anIdea.insertIntermediateMultiple).not.toHaveBeenCalled();
				});
				it('should pass on group attributes', function () {
					underTest.activateNode('test', 3);
					underTest.insertIntermediateGroup('test', { group: 'blue' });
					expect(anIdea.insertIntermediateMultiple).toHaveBeenCalledWith([2, 3], {title: 'group', attr: { group: 'blue', contentLocked: true } });
				});
				it('should not invoke idea.insertIntermediate when root is selected', function () {
					underTest.selectNode(anIdea.getDefaultRootId());
					underTest.insertIntermediateGroup('test', { group: 'blue' });
					expect(anIdea.insertIntermediateMultiple).not.toHaveBeenCalled();
				});
			});

			it('should not invoke idea.insertIntermediate when nothing is selected', function () {
				spyOn(anIdea, 'insertIntermediateMultiple');
				underTest.insertIntermediateGroup();
				expect(anIdea.insertIntermediateMultiple).not.toHaveBeenCalled();
			});

		});
		describe('addGroupSubidea', function () {
			beforeEach(function () {
				spyOn(anIdea, 'addSubIdea').and.callThrough();
				underTest.selectNode(1);
			});
			it('should add a node to represent the group with currently selected idea as parentId', function () {
				underTest.addGroupSubidea();
				expect(anIdea.addSubIdea).toHaveBeenCalledWith(1, 'group');
			});
			it('should add a contentLocked attribute to the group node', function () {
				var groupId;

				underTest.addGroupSubidea();

				groupId = anIdea.addSubIdea.calls.mostRecent().args[0];
				expect(anIdea.getAttrById(groupId, 'contentLocked')).toBeTruthy();
			});
			it('should add a group attribute to the group node', function () {
				var groupId;

				underTest.addGroupSubidea();

				groupId = anIdea.addSubIdea.calls.mostRecent().args[0];
				expect(anIdea.getAttrById(groupId, 'group')).toBeTruthy();
			});
			it('should add a typed group attribute to the group node', function () {
				var groupId;

				underTest.addGroupSubidea('source', {group: 'supporting'});

				groupId = anIdea.addSubIdea.calls.mostRecent().args[0];
				expect(anIdea.getAttrById(groupId, 'group')).toEqual('supporting');
			});
			it('should invoke idea.addSubIdea with argument idea as parentId if provided', function () {
				underTest.addGroupSubidea('source', {parentId: 555});
				expect(anIdea.addSubIdea).toHaveBeenCalledWith(555, 'group');
			});

			it('should add a node with the group node as parentId, as a batched event', function () {
				anIdea.addSubIdea.and.returnValues(22, 33);
				spyOn(anIdea, 'dispatchEvent');

				underTest.addGroupSubidea();
				expect(anIdea.addSubIdea).toHaveBeenCalledWith(22);
			});
			it('should add a node with the group node  as a batched event', function () {
				spyOn(anIdea, 'dispatchEvent');

				underTest.addGroupSubidea();
				expect(anIdea.dispatchEvent.calls.count()).toBe(1);
			});
			it('should edit the child node of the group node', function () {
				var listener = jasmine.createSpy('nodeEditRequested');

				anIdea.addSubIdea.and.returnValues(22, 33);
				underTest.addEventListener('nodeEditRequested', listener);

				underTest.addGroupSubidea();
				expect(listener.calls.count()).toBe(1);
				expect(listener).toHaveBeenCalledWith(33, true, true);
			});
			it('should not invoke idea.addSubIdea when input is disabled', function () {
				underTest.setInputEnabled(false);
				underTest.addGroupSubidea();
				expect(anIdea.addSubIdea).not.toHaveBeenCalled();
			});
			it('should expand the parent node when addSubIdea is called, as a batched event', function () {
				underTest.selectNode(1);
				underTest.collapse('source', true);
				spyOn(anIdea, 'updateAttr').and.callThrough();
				spyOn(anIdea, 'dispatchEvent');
				underTest.addGroupSubidea();
				expect(anIdea.updateAttr).toHaveBeenCalledWith(1, 'collapsed', false);
				expect(anIdea.dispatchEvent.calls.count()).toBe(1);
			});

		});
		describe('copy', function () {
			beforeEach(function () {
				spyOn(anIdea, 'cloneMultiple').and.returnValue('CLONE');
				underTest.selectNode(11);
				anIdea.cloneMultiple.and.returnValue([1, 2, 3, 4, 5]);
			});
			it('should clone active idea into clipboard when copy is called', function () {
				underTest.copy('keyboard');
				expect(anIdea.cloneMultiple).toHaveBeenCalledWith([11]);
				expect(clipboard.put).toHaveBeenCalledWith([1, 2, 3, 4, 5]);
			});
			it('should not clone if input is disabled', function () {
				underTest.setInputEnabled(false);
				underTest.copy('keyboard');
				expect(anIdea.cloneMultiple).not.toHaveBeenCalled();
			});
			it('should work on multiple active nodes', function () {
				underTest.activateNode('test', 12);
				underTest.copy('keyboard');
				expect(anIdea.cloneMultiple).toHaveBeenCalledWith([11, 12]);
			});
		});
		describe('paste', function () {
			describe('single nodes', function () {
				var toPaste;
				beforeEach(function () {
					toPaste = [{title: 'clone'}];
					clipboard.get.and.returnValue(toPaste);
					spyOn(anIdea, 'pasteMultiple');
					underTest.selectNode(12);
				});
				it('should paste clipboard into currently selected idea', function () {
					underTest.paste('keyboard');
					expect(anIdea.pasteMultiple).toHaveBeenCalledWith(12, toPaste);
				});
				it('should not paste when input is disabled', function () {
					underTest.setInputEnabled(false);
					underTest.paste('keyboard');
					expect(anIdea.pasteMultiple).not.toHaveBeenCalled();
				});
			});
		});
		describe('cut', function () {
			var toPaste;
			beforeEach(function () {
				toPaste = [{title: 'clone'}];
				spyOn(anIdea, 'cloneMultiple').and.returnValue(toPaste);
				spyOn(anIdea, 'pasteMultiple');
				spyOn(anIdea, 'removeMultiple');
				underTest.selectNode(11);
			});
			it('should invoke idea.removeMultiple when cut/paste method is invoked', function () {
				underTest.cut('keyboard');
				expect(anIdea.removeMultiple).toHaveBeenCalledWith([11]);
			});
			it('should invoke idea.removeMultipple for all active nodes', function () {
				underTest.activateNode('test', 12);
				underTest.cut('keyboard');
				expect(anIdea.removeMultiple).toHaveBeenCalledWith([11, 12]);
			});
			it('should clone all active nodes into the clipboard', function () {
				underTest.activateNode('test', 12);
				underTest.cut('keyboard');
				expect(anIdea.cloneMultiple).toHaveBeenCalledWith([11, 12]);
				expect(clipboard.put).toHaveBeenCalledWith(toPaste);
			});
			it('should not invoke idea.removeSubIdea when input is disabled', function () {
				underTest.setInputEnabled(false);
				underTest.cut('keyboard');
				expect(anIdea.removeMultiple).not.toHaveBeenCalled();
			});
		});
		describe('undo', function () {
			beforeEach(function () {
				underTest.selectNode(123);
				spyOn(anIdea, 'undo');
			});
			it('should invoke idea.undo', function () {
				underTest.undo();
				expect(anIdea.undo).toHaveBeenCalled();
			});
			it('should not invoke idea.undo input is disabled', function () {
				underTest.setInputEnabled(false);
				underTest.undo();
				expect(anIdea.undo).not.toHaveBeenCalled();
			});
		});
		describe('moveRelative', function () {
			beforeEach(function () {
				underTest.selectNode(123);
				spyOn(anIdea, 'moveRelative');
			});
			it('should invoke idea.moveRelative passing the argument', function () {
				underTest.moveRelative('keyboard', -1);
				expect(anIdea.moveRelative).toHaveBeenCalledWith(123, -1, undefined);
			});
			it('should not invoke idea.moveRelative when input is disabled', function () {
				underTest.setInputEnabled(false);
				underTest.moveRelative('keyboard', -1);
				expect(anIdea.moveRelative).not.toHaveBeenCalled();
			});
		});
		describe('layout-specific movements', function () {
			var layoutModel, layout;
			beforeEach(function () {
				layout = {
					nodes: {
						1: { x: 0, y: 10 },
						2: { x: -10, y: 10, attr: {style: {styleprop: 'oldValue'}}}
					}
				};
				layoutModel = jasmine.createSpyObj('layoutModel', ['getOrientation']);
				underTest = new MAPJS.MapModel(function () {
					return JSON.parse(JSON.stringify(layout)); /* deep clone */
				}, undefined, undefined, undefined, {layoutModel: layoutModel});
				spyOn(underTest, 'moveRelative');
				spyOn(underTest, 'flip');
				spyOn(underTest, 'addSiblingIdeaBefore');
				spyOn(underTest, 'insertIntermediate');
				spyOn(underTest, 'addSubIdea');
				spyOn(underTest, 'addSiblingIdea');
				spyOn(underTest, 'getStandardReorderBoundary');
				spyOn(underTest, 'getTopDownReorderBoundary');
				spyOn(underTest, 'standardPositionNodeAt');
				spyOn(underTest, 'topDownPositionNodeAt');
			});
			describe('insertUp', function () {
				it('adds a sibling before if layout is standard', function () {
					layoutModel.getOrientation.and.returnValue('standard');
					underTest.insertUp('keyboard');
					expect(underTest.addSiblingIdeaBefore).toHaveBeenCalledWith('keyboard');
					expect(underTest.insertIntermediate).not.toHaveBeenCalled();
				});
				it('adds an intermediate if layout is top-down', function () {
					layoutModel.getOrientation.and.returnValue('top-down');
					underTest.insertUp('keyboard');
					expect(underTest.addSiblingIdeaBefore).not.toHaveBeenCalled();
					expect(underTest.insertIntermediate).toHaveBeenCalledWith('keyboard');
				});
			});
			describe('insertDown', function () {
				it('adds a sibling after if layout is standard', function () {
					layoutModel.getOrientation.and.returnValue('standard');
					underTest.insertDown('keyboard');
					expect(underTest.addSiblingIdea).toHaveBeenCalledWith('keyboard');
					expect(underTest.addSubIdea).not.toHaveBeenCalled();
				});
				it('adds a child if layout is top-down', function () {
					layoutModel.getOrientation.and.returnValue('top-down');
					underTest.insertDown('keyboard');
					expect(underTest.addSiblingIdea).not.toHaveBeenCalled();
					expect(underTest.addSubIdea).toHaveBeenCalledWith('keyboard');
				});
			});
			describe('insertLeft', function () {
				it('adds an intermediate parent if layout is standard', function () {
					layoutModel.getOrientation.and.returnValue('standard');
					underTest.insertLeft('keyboard');
					expect(underTest.addSiblingIdeaBefore).not.toHaveBeenCalled();
					expect(underTest.insertIntermediate).toHaveBeenCalledWith('keyboard');
				});
				it('adds a sibling idea before the current one if layout is top-down', function () {
					layoutModel.getOrientation.and.returnValue('top-down');
					underTest.insertLeft('keyboard');
					expect(underTest.addSiblingIdeaBefore).toHaveBeenCalledWith('keyboard');
					expect(underTest.insertIntermediate).not.toHaveBeenCalled();
				});

			});
			describe('insertRight', function () {
				it('adds a sibling after the current one if the layout is top-down', function () {
					layoutModel.getOrientation.and.returnValue('top-down');
					underTest.insertRight('keyboard');
					expect(underTest.addSiblingIdea).toHaveBeenCalledWith('keyboard');
					expect(underTest.addSubIdea).not.toHaveBeenCalled();
				});
				it('adds a sub idea if the layout is standard', function () {
					layoutModel.getOrientation.and.returnValue('standard');
					underTest.insertRight('keyboard');
					expect(underTest.addSiblingIdea).not.toHaveBeenCalled();
					expect(underTest.addSubIdea).toHaveBeenCalledWith('keyboard');
				});

			});
			describe('moveUp', function () {
				it('moves relative if layout is standard', function () {
					layoutModel.getOrientation.and.returnValue('standard');
					underTest.moveUp('keyboard');
					expect(underTest.moveRelative).toHaveBeenCalledWith('keyboard', -1);
				});
				it('does nothing if layout is top-down', function () {
					layoutModel.getOrientation.and.returnValue('top-down');
					underTest.moveUp('keyboard');
					expect(underTest.moveRelative).not.toHaveBeenCalled();
				});
			});
			describe('moveDown', function () {
				it('moves relative if layout is standard', function () {
					layoutModel.getOrientation.and.returnValue('standard');
					underTest.moveDown('keyboard');
					expect(underTest.moveRelative).toHaveBeenCalledWith('keyboard', 1);
				});
				it('does nothing if layout is top-down', function () {
					layoutModel.getOrientation.and.returnValue('top-down');
					underTest.moveDown('keyboard');
					expect(underTest.moveRelative).not.toHaveBeenCalled();
				});
			});
			describe('moveLeft', function () {
				it('moves relative if layout is top-down', function () {
					layoutModel.getOrientation.and.returnValue('top-down');
					underTest.moveLeft('keyboard');
					expect(underTest.moveRelative).toHaveBeenCalledWith('keyboard', -1);
					expect(underTest.flip).not.toHaveBeenCalled();
				});
				it('tries to flip if layout is standard', function () {
					layoutModel.getOrientation.and.returnValue('standard');
					underTest.moveLeft('keyboard');
					expect(underTest.flip).toHaveBeenCalledWith('keyboard');
					expect(underTest.moveRelative).not.toHaveBeenCalled();
				});
			});
			describe('moveRight', function () {
				it('moves relative if layout is top-down', function () {
					layoutModel.getOrientation.and.returnValue('top-down');
					underTest.moveRight('keyboard');
					expect(underTest.moveRelative).toHaveBeenCalledWith('keyboard', 1);
					expect(underTest.flip).not.toHaveBeenCalled();
				});
				it('tries to flip if layout is standard', function () {
					layoutModel.getOrientation.and.returnValue('standard');
					underTest.moveRight('keyboard');
					expect(underTest.flip).toHaveBeenCalledWith('keyboard');
					expect(underTest.moveRelative).not.toHaveBeenCalled();
				});
			});
			describe('positionNodeAt', function () {
				it('delegates to the standard position if required', function () {
					layoutModel.getOrientation.and.returnValue('standard');
					underTest.positionNodeAt(1, 2, 3, 4);
					expect(underTest.standardPositionNodeAt).toHaveBeenCalledWith(1, 2, 3, 4);
					expect(underTest.topDownPositionNodeAt).not.toHaveBeenCalled();
				});
				it('delegates to the top-down position if required', function () {
					layoutModel.getOrientation.and.returnValue('top-down');
					underTest.positionNodeAt(1, 2, 3, 4);
					expect(underTest.topDownPositionNodeAt).toHaveBeenCalledWith(1, 2, 3, 4);
					expect(underTest.standardPositionNodeAt).not.toHaveBeenCalled();
				});
			});
			describe('getReorderBoundary', function () {
				it('delegates to the standard reorder boundary', function () {
					layoutModel.getOrientation.and.returnValue('standard');
					underTest.getReorderBoundary(1);
					expect(underTest.getStandardReorderBoundary).toHaveBeenCalledWith(1);
					expect(underTest.getTopDownReorderBoundary).not.toHaveBeenCalled();
				});
				it('delegates to the top-down reorder if required', function () {
					layoutModel.getOrientation.and.returnValue('top-down');
					underTest.getReorderBoundary(1);
					expect(underTest.getTopDownReorderBoundary).toHaveBeenCalledWith(1);
					expect(underTest.getStandardReorderBoundary).not.toHaveBeenCalled();
				});
			});
		});
		describe('standardPositionNodeAt', function () {
			beforeEach(function () {
				anIdea = MAPJS.content({
					id: 1,
					title: 'root',
					ideas: {
						10: {
							id: 2,
							title: 'child',
							ideas: {
								11: { id: 3, title: 'child of child' }
							}
						}
					}
				});
				underTest = new MAPJS.MapModel(function () {
					return {
						nodes: {1: {level: 1, rootId: 1}, 2: {level: 2, rootId: 1}, 3: {level: 3, rootId: 1}}
					};
				}, [], clipboard);
				underTest.setIdea(anIdea);
			});
			it('assigns position for root nodes', function () {
				underTest.standardPositionNodeAt(1, 2, 3, true);
				expect(anIdea.findSubIdeaById(1).attr.position).toEqual([2, 3, 1]);
			});
		});

		describe('redo', function () {
			beforeEach(function () {
				underTest.selectNode(123);
				spyOn(anIdea, 'redo');
			});
			it('should invoke idea.redo', function () {
				underTest.redo();
				expect(anIdea.redo).toHaveBeenCalled();
			});
			it('should not invoke idea.redo when input is disabled', function () {
				underTest.setInputEnabled(false);
				underTest.redo();
				expect(anIdea.redo).not.toHaveBeenCalled();
			});
		});
		describe('addSiblingIdea', function () {
			beforeEach(function () {
				spyOn(anIdea, 'addSubIdea').and.callThrough();
			});
			it('should invoke idea.addSubIdea with a parent of a currently selected node', function () {
				underTest.selectNode(2);
				underTest.addSiblingIdea();
				expect(anIdea.addSubIdea).toHaveBeenCalledWith(1);
			});
			it('should invoke idea.addSubIdea with a parent of a specified node', function () {
				var nodeId = anIdea.addSubIdea(2, 'test');
				anIdea.addSubIdea.calls.reset();
				underTest.selectNode(1);
				underTest.addSiblingIdea('keyboard', nodeId);
				expect(anIdea.addSubIdea).toHaveBeenCalledWith(2);
			});
			it('it should add sibling idea as a new root node if the selected node is one of the  root nodes', function () {
				underTest.addSiblingIdea('keyboard', 1, 'new root?');
				expect(anIdea.addSubIdea).toHaveBeenCalledWith('root', 'new root?');
				expect(_.size(anIdea.ideas)).toEqual(2);
			});
			it('should add with a title and select, but not invoke editNode if title is supplied', function () {
				var nodeEditRequestedListener = jasmine.createSpy('node edit requested'),
						nodeId = anIdea.addSubIdea(2, 'test');
				anIdea.addSubIdea.calls.reset();
				underTest.selectNode(1);
				underTest.addEventListener('nodeEditRequested', nodeEditRequestedListener);

				underTest.addSiblingIdea('keyboard', nodeId, 'initial title');
				expect(anIdea.addSubIdea).toHaveBeenCalledWith(2, 'initial title');
				expect(nodeEditRequestedListener).not.toHaveBeenCalled();
				expect(underTest.getSelectedNodeId()).toBe(4);
			});
			it('should expand the parent node if it is collapsed, as a batched event', function () {
				underTest.collapse('source', true);
				spyOn(anIdea, 'updateAttr').and.callThrough();
				spyOn(anIdea, 'dispatchEvent');

				underTest.selectNode(2);
				underTest.addSiblingIdea();
				expect(anIdea.updateAttr).toHaveBeenCalledWith(1, 'collapsed', false);
				expect(anIdea.dispatchEvent.calls.count()).toBe(1);
			});
			it('should not expand the parent node if it is the aggregate root', function () {
				anIdea.attr.collapsed =  true;
				spyOn(anIdea, 'updateAttr').and.callThrough();
				spyOn(anIdea, 'dispatchEvent');

				underTest.selectNode(1);
				underTest.addSiblingIdea();
				expect(anIdea.updateAttr).not.toHaveBeenCalled();
			});
			it('should not invoke anything if input is disabled', function () {
				underTest.setInputEnabled(false);
				underTest.addSiblingIdea();
				expect(anIdea.addSubIdea).not.toHaveBeenCalled();
			});
			describe('should add an idea at the same side as the currently selected idea', function () {
				it('adds right-side ideas when currently selected is on the right', function () {
					underTest.selectNode(2);
					underTest.addSiblingIdea();
					expect(anIdea.ideas[1].findChildRankById(3) > 0).toBeTruthy();
				});
				it('adds left-side ideas when currently selected is on the left', function () {
					underTest.selectNode(1);
					underTest.addSubIdea();
					underTest.selectNode(3);
					underTest.addSiblingIdea();

					expect(anIdea.ideas[1].findChildRankById(4) < 0).toBeTruthy();
				});
			});
			describe('inserting ideas in the middle of existing ideas', function () {
				var currentRanks;
				beforeEach(function () {
					underTest.selectNode(2);
					underTest.addSiblingIdea();
					currentRanks = _.map(anIdea.ideas[1].ideas, function (v, k) {
						return parseFloat(k);
					}).sort();

					anIdea.addSubIdea.calls.reset();
					underTest.selectNode(2);
					underTest.addSiblingIdea();
				});
				it('should not change ranks of siblings', function () {
					expect(anIdea.ideas[1].findChildRankById(2)).toBe(currentRanks[0]);
					expect(anIdea.ideas[1].findChildRankById(3)).toBe(currentRanks[1]);
				});
				it('should add an idea directly below the currently selected idea ID', function () {
					var newRank = anIdea.ideas[1].findChildRankById(4);
					expect(newRank > currentRanks[0]).toBeTruthy();
					expect(newRank < currentRanks[1]).toBeTruthy();
				});
			});
		});
		describe('addSiblingIdeaBefore', function () {
			beforeEach(function () {
				spyOn(anIdea, 'addSubIdea').and.callThrough();
			});
			it('should invoke idea.addSubIdea with a parent of a currently selected node', function () {
				underTest.selectNode(2);
				underTest.addSiblingIdeaBefore();
				expect(anIdea.addSubIdea).toHaveBeenCalledWith(1);
			});
			it('it should add sibling idea as a new root node if the selected node is one of the root nodes', function () {
				underTest.addSiblingIdeaBefore('keyboard');
				expect(anIdea.addSubIdea).toHaveBeenCalledWith('root');
				expect(_.size(anIdea.ideas)).toEqual(2);
			});
			it('should expand the parent node if it is collapsed, as a batched event', function () {
				underTest.selectNode(1);
				underTest.collapse('source', true);
				underTest.selectNode(2);
				spyOn(anIdea, 'updateAttr').and.callThrough();
				spyOn(anIdea, 'dispatchEvent');
				underTest.addSiblingIdeaBefore();
				expect(anIdea.updateAttr).toHaveBeenCalledWith(1, 'collapsed', false);
				expect(anIdea.dispatchEvent.calls.count()).toBe(1);
			});
			it('should expand the parent node if it is the map root', function () {
				anIdea.attr.collapsed = true;
				spyOn(anIdea, 'updateAttr').and.callThrough();
				spyOn(anIdea, 'dispatchEvent');
				underTest.addSiblingIdeaBefore();
				expect(anIdea.updateAttr).not.toHaveBeenCalled();
			});
			it('should not invoke anything if input is disabled', function () {
				underTest.setInputEnabled(false);
				underTest.addSiblingIdeaBefore();
				expect(anIdea.addSubIdea).not.toHaveBeenCalled();
			});
			describe('should add an idea at the same side as the currently selected idea', function () {
				it('adds right-side ideas when currently selected is on the right', function () {
					underTest.selectNode(2);
					underTest.addSiblingIdeaBefore();
					expect(anIdea.ideas[1].findChildRankById(3) > 0).toBeTruthy();
				});
				it('adds left-side ideas when currently selected is on the left', function () {
					underTest.selectNode(1);
					underTest.addSubIdea();
					underTest.selectNode(3);
					underTest.addSiblingIdeaBefore();

					expect(anIdea.ideas[1].findChildRankById(4) < 0).toBeTruthy();
				});
			});
			describe('inserting ideas in the middle of existing ideas', function () {
				var currentRanks;
				beforeEach(function () {
					underTest.selectNode(2);
					underTest.addSiblingIdea();
					currentRanks = _.map(anIdea.ideas[1].ideas, function (v, k) {
						return parseFloat(k);
					}).sort();

					underTest.selectNode(3);
					underTest.addSiblingIdeaBefore();
				});
				it('should not change ranks of siblings', function () {
					expect(anIdea.ideas[1].findChildRankById(2)).toBe(currentRanks[0]);
					expect(anIdea.ideas[1].findChildRankById(3)).toBe(currentRanks[1]);
				});
				it('should add an idea directly below the currently selected idea ID', function () {
					var newRank = anIdea.ideas[1].findChildRankById(4);
					expect(newRank > currentRanks[0]).toBeTruthy();
					expect(newRank < currentRanks[1]).toBeTruthy();
				});
			});
		});
		describe('clickNode', function () {
			var contextMenuRequestedListener, activatedNodesChangedListener;
			beforeEach(function () {
				contextMenuRequestedListener = jasmine.createSpy('contextMenuRequestedListener');
				underTest.addEventListener('contextMenuRequested', contextMenuRequestedListener);
				activatedNodesChangedListener = jasmine.createSpy('activatedNodesChanged');
				underTest.addEventListener('activatedNodesChanged', activatedNodesChangedListener);
			});
			it('should activate a node if shift is pressed', function () {
				underTest.clickNode(2, {shiftKey: true});
				expect(activatedNodesChangedListener).toHaveBeenCalledWith([2], []);
			});
			it('should deactivate an active node if shift is pressed', function () {
				underTest.selectNode(1);
				underTest.activateNode('test', 2);
				activatedNodesChangedListener.calls.reset();
				underTest.clickNode(2, {shiftKey: true});
				expect(activatedNodesChangedListener).toHaveBeenCalledWith([], [2]);
			});
			it('should select node when not in link mode', function () {
				spyOn(underTest, 'selectNode');

				underTest.clickNode(1);

				expect(underTest.selectNode).toHaveBeenCalledWith(1);
			});
			it('should toggle link when in link mode', function () {
				spyOn(underTest, 'selectNode');
				spyOn(underTest, 'toggleLink');
				underTest.toggleAddLinkMode();

				underTest.clickNode(2);

				expect(underTest.toggleLink).toHaveBeenCalledWith('mouse', 2);
				expect(underTest.selectNode).not.toHaveBeenCalled();
			});
			it('should select the node and dispatch contextMenuRequested event if node is right clicked', function () {
				spyOn(underTest, 'selectNode');

				underTest.clickNode(2, {button: 2, layerX: 100, layerY: 200});

				expect(contextMenuRequestedListener).toHaveBeenCalledWith(2, 100, 200);
				expect(underTest.selectNode).toHaveBeenCalledWith(2);
			});
			it('should not dispatch contextMenuRequested event if node is left clicked', function () {
				underTest.clickNode(2, {button: 0, layerX: 100, layerY: 200});

				expect(contextMenuRequestedListener).not.toHaveBeenCalled();
			});
			it('should not dispatch contextMenuRequested event if input is not enabled', function () {
				underTest.setInputEnabled(false);
				underTest.clickNode(2, {button: 2, layerX: 100, layerY: 200});

				expect(contextMenuRequestedListener).not.toHaveBeenCalled();
			});
			it('should not add link if right clicked, should dispatch contextMenuRequested event', function () {
				underTest.toggleAddLinkMode();
				spyOn(underTest, 'toggleLink');
				underTest.clickNode(2, {button: 2, layerX: 100, layerY: 200});
				expect(contextMenuRequestedListener).toHaveBeenCalledWith(2, 100, 200);
				expect(underTest.toggleLink).not.toHaveBeenCalled();
			});
		});
		describe('cancelCurrentAction', function () {
			var addLinkModeListener;
			beforeEach(function () {
				addLinkModeListener = jasmine.createSpy('addLinkModeToggled');
				underTest.addEventListener('addLinkModeToggled', addLinkModeListener);
			});
			it('cancels addLinkMode if active', function () {
				underTest.toggleAddLinkMode('source');
				addLinkModeListener.calls.reset();
				underTest.cancelCurrentAction();
				expect(addLinkModeListener).toHaveBeenCalledWith(false);
			});
			it('does nothing if addLinkMode not active', function () {
				underTest.cancelCurrentAction();
				expect(addLinkModeListener).not.toHaveBeenCalledWith();
			});
		});
		describe('updateLinkStyle', function () {
			var anIdea, underTest;
			beforeEach(function () {
				anIdea = MAPJS.content({
					id: 1,
					title: 'root',
					ideas: {
						10: {
							id: 2,
							title: 'child 2'
						},
						11: {
							id: 3,
							title: 'child 3'
						}
					},
					links: [{
						ideaIdFrom: 2,
						ideaIdTo: 3
					}]
				});
				underTest = new MAPJS.MapModel(function () {
					return {
						nodes: {2: {attr: {style: {styleprop: 'oldValue'}}}}
					};
				});
				spyOn(anIdea, 'updateLinkAttr').and.callThrough();
				underTest.setIdea(anIdea);
			});
			it('should invoke idea.updateLinkAttr when updateLinkStyle is invoked', function () {
				underTest.updateLinkStyle('source', 2, 3, 'color', 'black');

				expect(anIdea.updateLinkAttr).toHaveBeenCalledWith(2, 3, 'style', { color: 'black' });
			});
			it('should not invoke idea.updateLinkAttr if input is disabled', function () {
				underTest.setInputEnabled(false);

				underTest.updateLinkStyle('source', 2, 3, 'color', 'black');

				expect(anIdea.updateLinkAttr).not.toHaveBeenCalled();
			});
			it('should merge argument with previous style', function () {
				underTest.updateLinkStyle('source', 2, 3, 'color', 'black');

				underTest.updateLinkStyle('source', 2, 3, 'style', 'dashed');

				expect(anIdea.updateLinkAttr).toHaveBeenCalledWith(2, 3, 'style', {color: 'black', style: 'dashed'});
			});
		});
		describe('setAttachment', function () {
			var attachment;
			beforeEach(function () {
				spyOn(anIdea, 'updateAttr');
				underTest.selectNode(2);
				attachment = { contentType: 'text/html', content: 'Hello' };
			});
			it('should invoke idea.setAttr with specified ideaId and attachment argument when setAttachment is called', function () {
				underTest.setAttachment('source', 2, attachment);

				expect(anIdea.updateAttr).toHaveBeenCalledWith(2, 'attachment', attachment);
			});
			it('should remove attachment if no content', function () {
				underTest.setAttachment(
					'source',
					2,
					{
						contentType: 'text/html',
						content: ''
					}
				);

				expect(anIdea.updateAttr).toHaveBeenCalledWith(2, 'attachment', false);
			});
		});
		describe('setTheme', function () {
			var attachment;
			beforeEach(function () {
				spyOn(anIdea, 'updateAttr');
				underTest.selectNode(2);
				attachment = { contentType: 'text/html', content: 'Hello' };
			});
			it('should invoke idea.setAttr with root ideaId and theme argument', function () {
				underTest.setTheme('red');

				expect(anIdea.updateAttr).toHaveBeenCalledWith(anIdea.id, 'theme', 'red');
			});
		});
		describe('insertIntermediate', function () {
			var init = function (intermediaryArray) {
				underTest = new MAPJS.MapModel(
					function () {
						return {};
					},
					['What', 'a', 'beautiful', 'idea!'],
					intermediaryArray
				);
				underTest.setIdea(anIdea);
				spyOn(Math, 'random').and.returnValue(0.6);
				underTest.selectNode(2);
				spyOn(anIdea, 'insertIntermediateMultiple');
			};
			it('should invoke idea.insertIntermediate with the id of the selected node', function () {
				init();
				underTest.insertIntermediate();
				expect(anIdea.insertIntermediateMultiple).toHaveBeenCalledWith([2]);
			});
			it('should invoke idea.insertIntermediate with the ids of all active nodes of the selected node', function () {
				init();
				underTest.activateNode('test', 3);
				underTest.insertIntermediate();
				expect(anIdea.insertIntermediateMultiple).toHaveBeenCalledWith([2, 3]);
			});
			it('should invoke idea.insertIntermediate when a root node is selected', function () {
				spyOn(anIdea, 'insertIntermediateMultiple');
				underTest.insertIntermediate();
				expect(anIdea.insertIntermediateMultiple).toHaveBeenCalledWith([1]);
			});
			it('should not invoke anything if input is disabled', function () {
				init();
				underTest.setInputEnabled(false);
				underTest.insertIntermediate();
				expect(anIdea.insertIntermediateMultiple).not.toHaveBeenCalled();
			});
		});
		describe('setIcon', function () {
			beforeEach(function () {
				spyOn(anIdea, 'updateAttr').and.callThrough();
				spyOn(anIdea, 'removeSubIdea').and.callThrough();
				underTest.selectNode(1);
			});
			it('should change the icon attr of the idea if url is specified', function () {
				underTest.setIcon('test', 'http://www.google.com', 100, 200, 'center', 2);
				expect(anIdea.updateAttr).toHaveBeenCalledWith(2, 'icon', {
					url: 'http://www.google.com',
					width: 100,
					height: 200,
					position: 'center'
				});
			});
			it('should set the meta-data of the icon if the meta-arg is specified', function () {
				underTest.setIcon('test', 'http://www.google.com', 100, 200, 'center', 2, {blurb: 'blorb'});
				expect(anIdea.updateAttr).toHaveBeenCalledWith(2, 'icon', {
					url: 'http://www.google.com',
					width: 100,
					height: 200,
					position: 'center',
					metaData: {blurb: 'blorb'}
				});
			});
			it('should change the currently selected node icon if no id specified', function () {
				underTest.setIcon('test', 'http://www.google.com', 100, 200, 'center');
				expect(anIdea.updateAttr).toHaveBeenCalledWith(1, 'icon', {
					url: 'http://www.google.com',
					width: 100,
					height: 200,
					position: 'center'
				});
			});
			it('should change the icon attr of the idea if url is specified', function () {
				underTest.setEditingEnabled(false);
				underTest.setIcon('test', 'http://www.google.com', 100, 200, 'center', 2);
				expect(anIdea.updateAttr).not.toHaveBeenCalled();
			});
			it('should drop the icon if url is not set', function () {
				underTest.setIcon('test', false, 100, 200, 'center', 2);
				expect(anIdea.updateAttr).toHaveBeenCalledWith(2, 'icon', false);
			});
			it('should drop the node when dropping the icon if the node has no text or children', function () {
				var newId = anIdea.addSubIdea(1);
				underTest.setIcon('test', false, 100, 200, 'center', newId);
				expect(anIdea.updateAttr).toHaveBeenCalledWith(newId, 'icon', false);
				expect(anIdea.removeSubIdea).toHaveBeenCalledWith(newId);
			});
			it('should not drop the node if it has some text', function () {
				var newId = anIdea.addSubIdea(1);
				anIdea.updateTitle(newId, 'blah');
				underTest.setIcon('test', false, 100, 200, 'center', newId);
				expect(anIdea.updateAttr).toHaveBeenCalledWith(newId, 'icon', false);
				expect(anIdea.removeSubIdea).not.toHaveBeenCalled();
			});
			it('should not drop the node if it has children', function () {
				var newId = anIdea.addSubIdea(1);
				anIdea.addSubIdea(newId);
				underTest.setIcon('test', false, 100, 200, 'center', newId);
				expect(anIdea.updateAttr).toHaveBeenCalledWith(newId, 'icon', false);
				expect(anIdea.removeSubIdea).not.toHaveBeenCalled();
			});
		});
	});
	describe('map scaling and movement', function () {
		var underTest, mapScaleChangedListener, mapMoveRequestedListener, mapViewResetRequestedListener, nodeSelectionChangedListener, anIdea;
		beforeEach(function () {
			underTest = new MAPJS.MapModel(function () {
				return {
					nodes: {
						1: {id: 1, rootId: 1},
						2: {id: 2, rootId: 2},
						3: {id: 3, rootId: 1},
						4: {id: 4, rootId: 2}
					}
				};
			});
			anIdea = MAPJS.content({
					formatVersion: 3,
					id: 'root',
					ideas: {
						1: {
							id: 1,
							ideas: {
								1: { id: 3}
							}
						},
						2: {
							id: 2,
							ideas: {
								4: {id: 4}
							}
						}
					}
				});
			underTest.setIdea(anIdea);
			mapScaleChangedListener = jasmine.createSpy('mapScaleChanged');
			mapViewResetRequestedListener = jasmine.createSpy('mapViewReset');
			mapMoveRequestedListener = jasmine.createSpy('mapMoveRequested');
			nodeSelectionChangedListener = jasmine.createSpy('nodeSelectionChanged');
			underTest.addEventListener('mapScaleChanged', mapScaleChangedListener);
			underTest.addEventListener('mapViewResetRequested', mapViewResetRequestedListener);
			underTest.addEventListener('mapMoveRequested', mapMoveRequestedListener);
			underTest.addEventListener('nodeSelectionChanged', nodeSelectionChangedListener);
		});
		it('should dispatch mapScaleChanged event with 1.25 scale and no zoom point when scaleUp method is invoked', function () {
			underTest.scaleUp('toolbar');
			expect(mapScaleChangedListener).toHaveBeenCalledWith(1.25, undefined);
		});
		describe('resetView', function () {
			it('should select the local root node and dispatch mapViewResetRequested when resetView is called', function () {
				underTest.selectNode(3);
				nodeSelectionChangedListener.calls.reset();
				underTest.resetView();
				expect(mapViewResetRequestedListener).toHaveBeenCalled();
				expect(nodeSelectionChangedListener).toHaveBeenCalledWith(1, true);
			});
			it('should just dispatch mapViewResetRequested if a root node is selected', function () {
				underTest.selectNode(2);
				nodeSelectionChangedListener.calls.reset();
				underTest.resetView();
				expect(mapViewResetRequestedListener).toHaveBeenCalled();
				expect(nodeSelectionChangedListener).not.toHaveBeenCalled();
			});
			it('should select default root if the selected one is no longer in the layout', function () {
				underTest.selectNode(5);
				nodeSelectionChangedListener.calls.reset();
				spyOn(anIdea, 'getDefaultRootId').and.returnValue(2);
				underTest.resetView();
				expect(mapViewResetRequestedListener).toHaveBeenCalled();
				expect(nodeSelectionChangedListener).toHaveBeenCalledWith(2, true);
			});
		});

		it('should dispatch mapScaleChanged event with 0.8 and no zoom point when scaleDown method is invoked', function () {
			underTest.scaleDown('toolbar');
			expect(mapScaleChangedListener).toHaveBeenCalledWith(0.8, undefined);
		});
		it('should dispatch mapScaleChanged event with scale arguments when scale method is invoked', function () {
			underTest.scale('toolbar', 777, 'zoompoint');
			expect(mapScaleChangedListener).toHaveBeenCalledWith(777, 'zoompoint');
		});
		it('should dispatch mapMoveRequested passsing args when a move is requested', function () {
			underTest.move('toolbar', 100, 200);
			expect(mapMoveRequestedListener).toHaveBeenCalledWith(100, 200);
		});
		it('should not dispatch anything when input is disabled', function () {
			underTest.setInputEnabled(false);
			underTest.scale('toolbar', 777, 'zoompoint');
			underTest.move('toolbar', 100, 200);
			underTest.resetView();
			expect(mapMoveRequestedListener).not.toHaveBeenCalled();
			expect(mapScaleChangedListener).not.toHaveBeenCalled();
			expect(mapViewResetRequestedListener).not.toHaveBeenCalled();
		});
	});
	describe('Selection', function () {
		var nodeSelectionChangedListener, anIdea, underTest, layout, layoutModel;
		beforeEach(function () {
			anIdea = MAPJS.content({
				id: 1,
				title: 'center',
				ideas: {
					'-2': {
						id: 2,
						title: 'lower left'
					},
					'-1': {
						id: 3,
						title: 'upper left'
					},
					1: {
						id: 4,
						title: 'upper right',
						ideas: {
							1: { id: 7, title: 'cousin above' }
						}
					},
					2: {
						id: 5,
						title: 'lower right',
						ideas : {
							1: { id: 6, title: 'cousin below' },
							2: { id: 7, title: 'cousin benson', ideas: {1: {id: 8, title: 'child of cousin benson'}}}
						}
					}
				}
			});
			layout = {
				nodes: {
					1: { x: 0, y: 10 },
					2: { x: -10, y: 10, attr: {style: {styleprop: 'oldValue'}}},
					3: { x: -10, y: -10 },
					4: { x: 10, y: 10 },
					5: { x: 10, y: 30 },
					6: { x:	50, y: 10 },
					7: { x:	50, y: -10 }
				}
			};
			layoutModel = new MAPJS.LayoutModel({nodes: {}, connectors: {}});
			underTest = new MAPJS.MapModel(function () {
				return JSON.parse(JSON.stringify(layout)); /* deep clone */
			}, undefined, undefined, undefined, {layoutModel: layoutModel});
			underTest.setIdea(anIdea);
			nodeSelectionChangedListener = jasmine.createSpy();
			underTest.addEventListener('nodeSelectionChanged', nodeSelectionChangedListener);
		});
		it('should select the intermediate when it is inserted', function () {
			var newId;
			anIdea.addEventListener('changed', function (evt, args) {
				if (evt === 'insertIntermediate') {
					newId = args[2];
				}
			});
			underTest.selectNode(6);
			nodeSelectionChangedListener.calls.reset();
			underTest.insertIntermediate();
			expect(nodeSelectionChangedListener).toHaveBeenCalledWith(newId, true);
		});
		it('should select parent when a node is deleted', function () {
			underTest.selectNode(6);
			nodeSelectionChangedListener.calls.reset();
			underTest.removeSubIdea('toolbar');
			expect(nodeSelectionChangedListener).toHaveBeenCalledWith(5, true);
		});
		it('should select parent when a node is cut', function () {
			underTest.selectNode(6);
			underTest.cut('toolbar');
			expect(nodeSelectionChangedListener).toHaveBeenCalledWith(5, true);
		});
		it('should select pasted node when pasted', function () {
			underTest.selectNode(6);
			underTest.copy('toolbar');
			underTest.paste('toolbar');
			expect(nodeSelectionChangedListener).toHaveBeenCalledWith(9, true);
		});
		describe('selectNode', function () {
			it('should dispatch nodeSelectionChanged when a different node is selected', function () {
				underTest.selectNode(2);
				expect(nodeSelectionChangedListener).toHaveBeenCalledWith(2, true);
			});
			it('should dispatch nodeSelectionChanged with false and a previous node when a different node is selected', function () {
				underTest.selectNode(1);
				nodeSelectionChangedListener.calls.reset();
				underTest.selectNode(2);
				expect(nodeSelectionChangedListener).toHaveBeenCalledWith(1, false);
			});
			it('should not dispatch nodeSelectionChanged when the node is already selected', function () {
				underTest.selectNode(1);
				nodeSelectionChangedListener.calls.reset();
				underTest.selectNode(1);
				expect(nodeSelectionChangedListener).not.toHaveBeenCalled();
			});
			it('should not change selection if input is disabled', function () {
				underTest.setInputEnabled(false);
				underTest.selectNode(2);
				expect(nodeSelectionChangedListener).not.toHaveBeenCalled();
			});
			it('should change selection if forced even if input is disabled', function () {
				underTest.setInputEnabled(false);
				underTest.selectNode(2, true);
				expect(nodeSelectionChangedListener).toHaveBeenCalledWith(2, true);
			});
		});
		['Left', 'Right', 'Up', 'Down'].forEach(function (direction) {
			describe('selectNode' + direction, function () {
				var layoutModelMethod = 'nodeId' + direction,
					modelMethod = 'selectNode' + direction;

				beforeEach(function () {
					spyOn(layoutModel, layoutModelMethod);
					layoutModel[layoutModelMethod].and.returnValue(3);
				});
				it('should send the selected node id when calling layoutModel', function () {
					underTest.selectNode(5);
					underTest[modelMethod]();
					expect(layoutModel[layoutModelMethod]).toHaveBeenCalledWith(5);
				});
				it('should not change selection if input is disabled', function () {
					underTest.setInputEnabled(false);
					underTest[modelMethod]();
					expect(layoutModel[layoutModelMethod]).not.toHaveBeenCalled();
					expect(nodeSelectionChangedListener).not.toHaveBeenCalled();
				});
				it('should not change selection when layoutModel returns falsy', function () {
					layoutModel[layoutModelMethod].and.returnValue(false);
					underTest[modelMethod]();
					expect(nodeSelectionChangedListener).not.toHaveBeenCalled();
				});
				it('should select node returned by layoutModel', function () {
					underTest[modelMethod]();
					expect(nodeSelectionChangedListener).toHaveBeenCalledWith(3, true);
				});
			});
		});

		describe('multiple node activation', function () {
			var activatedNodesChangedListener,
				checkActivated = function (nodeId, previouslySelected) {
					previouslySelected = previouslySelected || 1;
					expect(activatedNodesChangedListener).toHaveBeenCalledWith([nodeId], []);
					expect(nodeSelectionChangedListener).toHaveBeenCalledWith(previouslySelected, false);
					expect(nodeSelectionChangedListener).toHaveBeenCalledWith(nodeId, true);
					expect(underTest.getActivatedNodeIds()).toEqual([previouslySelected, nodeId]);
				};

			beforeEach(function () {
				activatedNodesChangedListener = jasmine.createSpy();
				underTest.addEventListener('activatedNodesChanged', activatedNodesChangedListener);
			});
			describe('activating relative to current selection', function () {
				['Left', 'Right', 'Up', 'Down'].forEach(function (direction) {
					describe('activateNode' + direction, function () {
						var layoutModelMethod = 'nodeId' + direction,
							modelMethod = 'activateNode' + direction;

						beforeEach(function () {
							spyOn(layoutModel, layoutModelMethod);
							layoutModel[layoutModelMethod].and.returnValue(4);
						});
						it('should send the selected node id when calling layoutModel', function () {
							underTest.selectNode(5);
							underTest[modelMethod]();
							expect(layoutModel[layoutModelMethod]).toHaveBeenCalledWith(5);
						});
						it('should not change activation if input is disabled', function () {
							underTest.setInputEnabled(false);
							underTest[modelMethod]();
							expect(activatedNodesChangedListener).not.toHaveBeenCalled();
							expect(underTest.getCurrentlySelectedIdeaId()).toBe(1);
						});
						it('should not change activation when layoutModel returns falsy', function () {
							layoutModel[layoutModelMethod].and.returnValue(false);
							underTest[modelMethod]();
							expect(activatedNodesChangedListener).not.toHaveBeenCalled();
						});
						it('should activate parent node when currently selected node left of central node', function () {
							underTest.selectNode(3);
							nodeSelectionChangedListener.calls.reset();
							underTest[modelMethod]();
							checkActivated(4, 3);
						});
					});
				});
			});
			describe('activating groups of nodes', function () {
				it('should send event showing nodes activated and nodes deactivated when the selected node changed', function () {
					underTest.selectNode(7);
					activatedNodesChangedListener.calls.reset();

					underTest.selectNode(3);
					expect(activatedNodesChangedListener).toHaveBeenCalledWith([3], [7]);
				});
				it('should send event showing nodes activated and nodes deactivated when the sibling nodes are activated', function () {
					underTest.selectNode(3);
					underTest.activateSiblingNodes();
					expect(activatedNodesChangedListener.calls.mostRecent().args[0].sort()).toEqual([2, 4, 5]);
					expect(activatedNodesChangedListener.calls.mostRecent().args[1]).toEqual([]);
				});
				it('should send event showing nodes activated and nodes deactivated when the selected node and all its children are activated', function () {
					underTest.selectNode(5);
					activatedNodesChangedListener.calls.reset();
					underTest.activateNodeAndChildren();
					expect(activatedNodesChangedListener.calls.first().args[0].sort()).toEqual([6, 7, 8]);
					expect(activatedNodesChangedListener.calls.first().args[1]).toEqual([]);
				});
				it('should send event showing nodes activated and nodes deactivated when the children of the selected node are activated', function () {
					underTest.selectNode(5);
					activatedNodesChangedListener.calls.reset();
					underTest.activateChildren();
					expect(activatedNodesChangedListener.calls.first().args[0].sort()).toEqual([6, 7, 8]);
					expect(activatedNodesChangedListener.calls.first().args[1]).toEqual([5]);
				});
				it('should not deactivate selected nodes when activate children called and selected node is leaf node', function () {
					underTest.selectNode(2);
					activatedNodesChangedListener.calls.reset();
					underTest.activateChildren();
					expect(activatedNodesChangedListener).not.toHaveBeenCalled();
				});
				it('should not deactivate selected nodes when activate children called and selected node is collapsed', function () {
					anIdea.updateAttr(5, 'collapsed', true);
					underTest.selectNode(5);
					activatedNodesChangedListener.calls.reset();
					underTest.activateChildren();
					expect(activatedNodesChangedListener).not.toHaveBeenCalled();
				});
				it('should reset activation if the currently selected node was not active, but gets re-selected (eg click on center after selecting level)', function () {
					underTest.selectNode(5);
					underTest.activateChildren();
					activatedNodesChangedListener.calls.reset();

					underTest.selectNode(5);

					expect(activatedNodesChangedListener.calls.count()).toBe(1);
					expect(activatedNodesChangedListener).toHaveBeenCalledWith([5], [6, 8, 7]);
				});
			});
			describe('single activation', function () {
				it('activates a node if not already active', function () {
					underTest.activateNode('source', 7);
					expect(activatedNodesChangedListener).toHaveBeenCalledWith([7], []);
				});
				it('does nothing if node is already active', function () {
					underTest.activateNode('source', 7);
					activatedNodesChangedListener.calls.reset();
					underTest.activateNode('source', 7);
					expect(activatedNodesChangedListener).not.toHaveBeenCalled();
				});
			});
			describe('getActivatedNodeIds', function () {
				it('should return the selected node id ', function () {
					underTest.selectNode(1);
					expect(underTest.getActivatedNodeIds()).toEqual([1]);
				});
				it('should return activated nodes', function () {
					underTest.selectNode(3);
					underTest.activateSiblingNodes();
					expect(underTest.getActivatedNodeIds().sort()).toEqual([2, 3, 4, 5]);
				});
				it('should not allow the internal representation ot be mutated', function () {
					var toMutate;
					underTest.selectNode(3);
					toMutate = underTest.getActivatedNodeIds();
					toMutate.push(42);
					expect(underTest.getActivatedNodeIds()).toEqual([3]);
				});
			});
			describe('actions on activated nodes', function () {
				var changedListener;
				beforeEach(function () {
					underTest.selectNode(1);
					spyOn(anIdea, 'updateAttr').and.callThrough();
					changedListener = jasmine.createSpy();
					anIdea.addEventListener('changed', changedListener);
				});
				describe('collapse', function () {
					it('should collapse all activated nodes that have child nodes when toggleCollapse is called', function () {
						underTest.selectNode(3);
						underTest.activateSiblingNodes();
						underTest.collapse('source', true);
						expect(anIdea.updateAttr).toHaveBeenCalledWith(5, 'collapsed', true);
					});
					it('should expand child nodes when only child nodes activated and selected node is not collapsed', function () {
						anIdea.updateAttr(7, 'collapsed', true);
						underTest.selectNode(5);
						underTest.activateChildren();
						anIdea.updateAttr.calls.reset();
						underTest.toggleCollapse();
						expect(anIdea.updateAttr).toHaveBeenCalledWith(7, 'collapsed', false);
					});

					it('should update selected node style to collapsed when argument is true', function () {
						underTest.collapse('source', true);
						expect(anIdea.updateAttr).toHaveBeenCalledWith(1, 'collapsed', true);
					});
					it('should expand selected node when argument is false', function () {
						underTest.collapse('source', false);
						expect(anIdea.updateAttr).toHaveBeenCalledWith(1, 'collapsed', false);
					});
					it('should not update styles if input is disabled', function () {
						underTest.setInputEnabled(false);
						underTest.collapse('source', false);
						expect(anIdea.updateAttr).not.toHaveBeenCalled();
					});
					it('should not update style on leaf nodes', function () {
						underTest.selectNode(2);
						underTest.collapse('source', true);
						expect(anIdea.updateAttr).not.toHaveBeenCalled();
					});
				});
				describe('updateStyle', function () {
					beforeEach(function () {
						underTest.selectNode(2);
						spyOn(anIdea, 'mergeAttrProperty').and.callThrough();
					});
					it('should invoke idea.mergeAttrProperty for all activated nodes when toggleCollapse is called as a batch', function () {
						var i;
						underTest.selectNode(3);
						underTest.activateSiblingNodes();
						changedListener.calls.reset();
						underTest.updateStyle('source', 'styleprop', 'styleval');
						for (i = 2; i <= 5; i++) {
							expect(anIdea.mergeAttrProperty).toHaveBeenCalledWith(i, 'style', 'styleprop', 'styleval');
						}
						expect(changedListener.calls.count()).toBe(1);
					});

					it('should invoke idea.mergeAttrProperty with selected ideaId and style argument when updateStyle is called', function () {
						underTest.updateStyle('source', 'styleprop', 'styleval');
						expect(anIdea.mergeAttrProperty).toHaveBeenCalledWith(2, 'style', 'styleprop', 'styleval');
					});
					it('should not invoke idea.mergeAttrProperty if input is disabled', function () {
						underTest.setInputEnabled(false);
						underTest.updateStyle('source', 'styleprop', 'styleval');
						expect(anIdea.mergeAttrProperty).not.toHaveBeenCalled();
					});
					it('should not invoke idea if setting the same prop value - this is to prevent roundtrips from the default background and other calculated props in layout', function () {
						underTest.updateStyle('source', 'styleprop', 'oldValue');
						expect(anIdea.mergeAttrProperty).not.toHaveBeenCalled();
					});

				});
				describe('pasteStyle', function () {
					var toPaste;
					beforeEach(function () {
						toPaste = {title: 'c', attr: {style: {color: 'red'}}};
						spyOn(anIdea, 'clone').and.returnValue(toPaste);
						underTest.selectNode(11);
						underTest.copy('keyboard');
						underTest.selectNode(2);
					});
					it('should invoke paste style on all activated nodes', function () {
						var i;
						underTest.selectNode(3);
						underTest.activateSiblingNodes();
						changedListener.calls.reset();
						underTest.pasteStyle('keyboard');
						for (i = 2; i <= 5; i++) {
							expect(anIdea.updateAttr).toHaveBeenCalledWith(i, 'style', toPaste.attr.style);
						}
						expect(changedListener.calls.count()).toBe(1);
					});
					it('should set root node style from clipboard to currently selected idea', function () {
						underTest.pasteStyle('keyboard');
						expect(anIdea.updateAttr).toHaveBeenCalledWith(2, 'style', toPaste.attr.style);
					});
					it('should not paste when input is disabled', function () {
						underTest.setInputEnabled(false);
						underTest.pasteStyle('keyboard');
						expect(anIdea.updateAttr).not.toHaveBeenCalled();
					});
				});
				describe('removeSubIdea', function () {
					beforeEach(function () {
						spyOn(anIdea, 'removeSubIdea');
						underTest.selectNode(321);
					});
					it('should invoke idea.removeSubIdea on all activated nodes as one batch', function () {
						var i;
						underTest.selectNode(3);
						underTest.activateSiblingNodes();
						changedListener.calls.reset();

						underTest.removeSubIdea('toolbar');

						for (i = 2; i <= 5; i++) {
							expect(anIdea.removeSubIdea).toHaveBeenCalledWith(i);
						}
					});
					it('should invoke idea.removeSubIdea with currently selected idea', function () {
						underTest.removeSubIdea('toolbar');
						expect(anIdea.removeSubIdea).toHaveBeenCalledWith(321);
					});
					it('should not invoke idea.removeSubIdea when input is disabled', function () {
						underTest.setInputEnabled(false);
						underTest.removeSubIdea('toolbar');
						expect(anIdea.removeSubIdea).not.toHaveBeenCalled();
					});
				});

			});
		});
	});
	describe('analytic events', function () {
		var underTest, analyticListener, anIdea;
		beforeEach(function () {
			underTest = new MAPJS.MapModel(function () {
				return {
					nodes: {
						1: { x: 0 },
						2: { x: -10 },
						3: { x: -10 },
						4: { x: 10 },
						5: { x: 10 }
					}
				};
			});
			anIdea = MAPJS.content({
				id: 1,
				title: 'center',
				ideas: {
					'-2': {
						id: 2,
						title: 'lower left'
					},
					'-1': {
						id: 3,
						title: 'upper left'
					},
					1: {
						id: 4,
						title: 'upper right'
					},
					2: {
						id: 5,
						title: 'lower right',
						ideas : {
							1: {
								id: 6
							}
						}
					}
				}
			});
			underTest.setIdea(anIdea);
			analyticListener = jasmine.createSpy();
			underTest.addEventListener('analytic', analyticListener);
		});
		describe('should dispatch analytic event', function () {
			var allMethods = ['flip', 'cut', 'copy', 'paste', 'pasteStyle', 'redo', 'undo', 'scaleUp', 'scaleDown', 'move', 'moveRelative', 'addSubIdea',
				'addSiblingIdea', 'addSiblingIdeaBefore', 'removeSubIdea', 'editNode', 'selectNodeLeft', 'selectNodeRight', 'selectNodeUp', 'selectNodeDown',
				'resetView', 'openAttachment', 'setAttachment', 'activateNodeAndChildren', 'activateNode', 'activateSiblingNodes', 'activateChildren', 'activateSelectedNode', 'toggleAddLinkMode', 'addLink', 'selectLink',
				'setIcon', 'removeLink'];
			_.each(allMethods, function (method) {
				it('when ' + method + ' method is invoked', function () {
					var spy = jasmine.createSpy(method);
					underTest.addEventListener('analytic', spy);
					underTest[method]('source');
					expect(spy).toHaveBeenCalledWith('mapModel', method, 'source');
				});
			});
			it('when collapse method is invoked', function () {
				underTest.collapse('toolbar', false);

				expect(analyticListener).toHaveBeenCalledWith('mapModel', 'collapse:false', 'toolbar');
			});
			it('when collapse method is invoked', function () {
				underTest.updateStyle('toolbar', 'propname', 'propval');

				expect(analyticListener).toHaveBeenCalledWith('mapModel', 'updateStyle:propname', 'toolbar');
			});
			it('when insertIntermediate method is invoked, unless there is nothing selected', function () {
				underTest.selectNode(6);

				underTest.insertIntermediate('toolbar');

				expect(analyticListener).toHaveBeenCalledWith('mapModel', 'insertIntermediate', 'toolbar');
			});
		});
		it('should not dispatch analytic event when insertIntermediate method is invoked and nothing selected', function () {
			underTest.insertIntermediate('toolbar');

			expect(analyticListener).not.toHaveBeenCalledWith();
		});
		describe('when editing is disabled edit methods should not execute ', function () {
			var editingMethods = ['flip', 'cut', 'copy', 'paste', 'pasteStyle', 'redo', 'undo', 'moveRelative', 'addSubIdea',
				'addSiblingIdea', 'addSiblingIdeaBefore', 'removeSubIdea', 'editNode', 'setAttachment', 'updateStyle', 'insertIntermediate', 'updateLinkStyle', 'toggleAddLinkMode', 'addLink', 'selectLink', 'removeLink'];
			_.each(editingMethods, function (method) {
				it(method + ' does not execute', function () {
					var spy = jasmine.createSpy(method);
					underTest.selectNode(6);
					underTest.setEditingEnabled(false);

					underTest.addEventListener('analytic', spy);
					underTest[method]('source');
					expect(spy).not.toHaveBeenCalled();
				});
			});

		});
		describe('when editing is disabled navigational methods should still execute ', function () {
			var navigationMethods = ['scaleUp', 'scaleDown', 'move', 'collapse',
				'selectNodeLeft', 'selectNodeRight', 'selectNodeUp', 'selectNodeDown',
				'resetView', 'openAttachment', 'activateNodeAndChildren', 'activateNode', 'activateSiblingNodes', 'activateChildren', 'activateSelectedNode'];
			_.each(navigationMethods, function (method) {
				it(method + ' executes', function () {
					var spy = jasmine.createSpy(method);
					underTest.setEditingEnabled(false);

					underTest.addEventListener('analytic', spy);
					underTest[method]('source');
					expect(spy).toHaveBeenCalled();
				});
			});
		});

	});
	describe('getSelectedStyle', function () {
		var anIdea = MAPJS.content({ id: 1, style: {'v': 'x'}, ideas : {7: {id: 2, style: {'v': 'y'}}}}),
			layoutCalculator = function () {
				return {
					nodes: {
						1: {
							attr: {
								style: {
									'v': 'x'
								}
							}
						},
						2: {
							attr: {
								style: {
									'v': 'y'
								}
							}
						}
					}
				};
			},
			underTest;
		beforeEach(function () {
			underTest = new MAPJS.MapModel(layoutCalculator);
			underTest.setIdea(anIdea);
		});
		it('retrieves root node style by default', function () {
			expect(underTest.getSelectedStyle('v')).toEqual('x');
		});
		it('retrieves root node style by default', function () {
			underTest.selectNode(2);
			expect(underTest.getSelectedStyle('v')).toEqual('y');
		});
	});
	describe('Links', function () {
		var anIdea = MAPJS.content({
				id: 1,
				title: '1',
				ideas : {
					7: {
						id: 2,
						title: '2',
						ideas: {
							77: {
								id: 3,
								title: '3'
							},
							88: {
								id: 4,
								title: '4'
							},
							99: {
								id: 5,
								title: '5'
							}
						}
					}
				},
				links: [{
					ideaIdFrom: 1,
					ideaIdTo: 4
				}]
			}),
			layoutCalculator,
			underTest;
		beforeEach(function () {
			layoutCalculator = jasmine.createSpy();
			layoutCalculator.and.returnValue({
				nodes: {},
				links: {
					'1_4': {
						ideaIdFrom: '1',
						ideaIdTo: '4'
					}
				}
			});
			underTest = new MAPJS.MapModel(layoutCalculator);
			underTest.setIdea(anIdea);
		});
		it('should invoke content.addLink when addLink method is invoked', function () {
			spyOn(anIdea, 'addLink');

			underTest.addLink('source', 2);

			expect(anIdea.addLink).toHaveBeenCalledWith(1, 2);
		});
		it('should invoke content.addLink when toggleLink method is invoked', function () {
			spyOn(anIdea, 'addLink');

			underTest.addLink('source', 2);

			expect(anIdea.addLink).toHaveBeenCalledWith(1, 2);
		});

		it('should invoke content.removeLink when toggleLink method is called but link already exists', function () {
			anIdea.addLink(3, 4);
			underTest.selectNode(4);

			spyOn(anIdea, 'removeLink');

			underTest.toggleLink('source', 3);

			expect(anIdea.removeLink).toHaveBeenCalledWith(3, 4);
		});
		it('should invoke content.removeLink when toggleLink method is called but inverse link already exists', function () {
			anIdea.addLink(3, 4);
			underTest.selectNode(3);

			spyOn(anIdea, 'removeLink');

			underTest.toggleLink('source', 4);

			expect(anIdea.removeLink).toHaveBeenCalledWith(3, 4);
		});

		it('should dispatch linkCreated event when a new link is created', function () {
			var linkCreatedListener = jasmine.createSpy('linkCreated');
			underTest.addEventListener('linkCreated', linkCreatedListener);
			layoutCalculator.and.returnValue({
				nodes: {},
				links: {
					'1_4': {
						ideaIdFrom: '1',
						ideaIdTo: '4'
					},
					'1_3': {
						ideaIdFrom: '1',
						ideaIdTo: '3'
					}
				}
			});

			underTest.addLink('source', 3);

			expect(linkCreatedListener).toHaveBeenCalledWith({
				ideaIdFrom: '1',
				ideaIdTo: '3'
			}, undefined);
			expect(linkCreatedListener).not.toHaveBeenCalledWith({
				ideaIdFrom: '1',
				ideaIdTo: '4'
			});
		});
		it('should dispatch linkRemoved event when a link is removed', function () {
			var linkRemovedListener = jasmine.createSpy('linkRemovedListener');
			underTest.addEventListener('linkRemoved', linkRemovedListener);
			layoutCalculator.and.returnValue({
				nodes: {},
				links: {
					'1_3': {
						ideaIdFrom: '1',
						ideaIdTo: '3'
					}
				}
			});

			underTest.removeLink('source', 1, 4);

			expect(linkRemovedListener).toHaveBeenCalledWith({
				ideaIdFrom: '1',
				ideaIdTo: '4'
			});
		});
		it('should be able to add two links', function () {
			var linkCreatedListener = jasmine.createSpy('linkCreated');
			underTest.addEventListener('linkCreated', linkCreatedListener);
			layoutCalculator.and.returnValue({
				nodes: {},
				links: {
					'1_4': {
						ideaIdFrom: '1',
						ideaIdTo: '4'
					},
					'1_3': {
						ideaIdFrom: '1',
						ideaIdTo: '3'
					}
				}
			});
			underTest.addLink('source', 3);
			layoutCalculator.and.returnValue({
				nodes: {},
				links: {
					'1_4': {
						ideaIdFrom: '1',
						ideaIdTo: '4'
					},
					'1_3': {
						ideaIdFrom: '1',
						ideaIdTo: '3'
					},
					'1_5': {
						ideaIdFrom: '1',
						ideaIdTo: '5'
					}
				}
			});

			underTest.addLink('source', 5);

			expect(linkCreatedListener).toHaveBeenCalledWith({
				ideaIdFrom: '1',
				ideaIdTo: '5'
			}, undefined);
		});
		it('should dispatch linkSelected event when selectLink method is invoked', function () {
			var linkSelectedListener = jasmine.createSpy('linkSelectedListener');
			underTest.addEventListener('linkSelected', linkSelectedListener);

			underTest.selectLink('source', { ideaIdFrom: 1, ideaIdTo: 4 }, { x: 100, y: 100 });

			expect(linkSelectedListener).toHaveBeenCalledWith({ ideaIdFrom: 1, ideaIdTo: 4 }, { x: 100, y: 100 }, false);
		});
	});
	describe('focusOn', function () {
		var nodeSelectionChangedListener, anIdea, underTest, layout, changeListener, nodeNodeFocusRequestedListener, calls;
		beforeEach(function () {
			anIdea = MAPJS.content({
				id: 1,
				title: 'center',
				ideas: {
					'-2': {
						id: 2,
						title: 'lower left'
					},
					'-1': {
						id: 3,
						title: 'upper left'
					},
					1: {
						id: 4,
						title: 'upper right',
						ideas: {
							1: { id: 7, title: 'cousin above' }
						}
					},
					2: {
						id: 5,
						title: 'lower right',
						attr: {collapsed: true},
						ideas : {
							1: { id: 6, title: 'cousin below' },
							2: {
								id: 7,
								title: 'cousin benson',
								attr: {collapsed: true},
								ideas: {1: {id: 8, title: 'child of cousin benson'}}
							}
						}
					}
				}
			});
			layout = {
				nodes: {
					1: { x: 0, y: 10 },
					2: { x: -10, y: 10, attr: {style: {styleprop: 'oldValue'}}},
					3: { x: -10, y: -10 },
					4: { x: 10, y: 10 },
					5: { x: 10, y: 30 }
				}
			};
			underTest = new MAPJS.MapModel(function () {
				return JSON.parse(JSON.stringify(layout)); /* deep clone */
			});
			underTest.setIdea(anIdea);
			calls = [];
			nodeSelectionChangedListener = jasmine.createSpy('nodeSelectionChanged').and.callFake(function () {
				calls.push('nodeSelectionChanged');
			});
			nodeNodeFocusRequestedListener = jasmine.createSpy('nodeFocusRequested').and.callFake(function () {
				calls.push('nodeFocusRequested');
			});
			changeListener = jasmine.createSpy('change');
			underTest.addEventListener('nodeSelectionChanged', nodeSelectionChangedListener);
			anIdea.addEventListener('changed', changeListener);
			underTest.addEventListener('nodeFocusRequested', nodeNodeFocusRequestedListener);
		});
		it('if the node is not in the layout, uncollapses all its parents as a batch to ensure that it appears on screen', function () {
			underTest.centerOnNode(8);

			expect(anIdea.getAttrById(7, 'collapsed')).toBeFalsy();
			expect(anIdea.getAttrById(5, 'collapsed')).toBeFalsy();
			expect(changeListener.calls.count()).toBe(1);
		});
		it('if the nodes is in the layout, does not touch parents', function () {
			underTest.centerOnNode(5);
			expect(changeListener).not.toHaveBeenCalled();
		});
		it('dispatches nodeFocusRequested then nodeSelectionChanged', function () {
			underTest.centerOnNode(8);
			expect(nodeSelectionChangedListener).toHaveBeenCalledWith(8, true);
			expect(nodeNodeFocusRequestedListener).toHaveBeenCalledWith(8);
			expect(calls).toEqual(['nodeFocusRequested', 'nodeSelectionChanged', 'nodeSelectionChanged']);
		});
	});

	describe('getNodeIdAtPosition', function () {
		var underTest, layout;
		beforeEach(function () {
			layout = {
				nodes: {
					'1.1': { id: '1.1', x: 0, y: 100, width: 10, height: 10 },
					2: { id: 2, x: -100, y: 100, width: 10, height: 10, attr: {style: {styleprop: 'oldValue'}}},
					3: { id: 3, x: -100, y: -100, width: 10, height: 10 }
				}
			};
			underTest = new MAPJS.MapModel(function () {
				return JSON.parse(JSON.stringify(layout)); /* deep clone */
			});
			underTest.setIdea(MAPJS.observable({getAttr: function () { }, getDefaultRootId: function () {
				return '1.1';
			}}));
		});

		describe(' calculates points',
			[
				['return false if no node at point', 0, 0, undefined],
				['return nodeId if smack at centre', 5, 105, '1.1'],
				['return nodeId if at top left', 0, 100, '1.1'],
				['return nodeId if at bottom left', -100, -90, 3],
				['return nodeId if at top right', -100, 110, 2],
				['return nodeId if at bottom right', -90, 110, 2]
			], function (x, y, expected) {
				expect(underTest.getNodeIdAtPosition(x, y)).toEqual(expected);
			});
	});


	describe('search', function () {
		var anIdea, underTest;
		beforeEach(function () {
			anIdea = MAPJS.content({
				id: 1,
				title: 'center',
				ideas: {
					'-2': {
						id: 2,
						title: 'lower left'
					},
					'-1': {
						id: 3,
						title: 'upper left'
					},
					1: {
						id: 4,
						title: 'upper right',
						ideas: {
							1: { id: 41, title: 'cousin above' }
						}
					},
					2: {
						id: 5,
						title: 'lower right',
						attr: {collapsed: true},
						ideas : {
							1: { id: 6, title: 'cousin below' },
							2: {
								id: 7,
								title: 'cousin Benson',
								attr: {collapsed: true},
								ideas: {1: {id: 8, title: 'child of cousin benson'}}
							}
						}
					}
				}
			});
			underTest = new MAPJS.MapModel(function () {
				return [];
			});
			underTest.setIdea(anIdea);
		});
		it('given part of a title, returns a list of nodes with that title flattened to id and title', function () {
			expect(underTest.search('cousin')).toEqual([
				{id: 41, title: 'cousin above'},
				{id: 6, title: 'cousin below'},
				{id: 7, title: 'cousin Benson'},
				{id: 8, title: 'child of cousin benson'}
			]);
		});
		it('searches case insensitive', function () {
			expect(underTest.search('benson')).toEqual([
				{id: 7, title: 'cousin Benson'},
				{id: 8, title: 'child of cousin benson'}
			]);

		});
	});
	describe('pause and resume', function () {
		var anIdea, underTest, spy, layoutCalculator;
		beforeEach(function () {
			anIdea = MAPJS.content({
				id: 1,
				title: 'center',
				ideas: {
					'-2': {
						id: 2,
						title: 'lower left'
					}
				}
			});
			spy = jasmine.createSpy('nodeTitleChanged');
			layoutCalculator = jasmine.createSpy('layoutCalculator');
			layoutCalculator.and.returnValue({nodes: {1: {title: 'center', id: 1}, 2: {title: 'lower left', id: 2}}});
			underTest = new MAPJS.MapModel(layoutCalculator);
			underTest.setIdea(anIdea);
			underTest.addEventListener('nodeTitleChanged', spy);
			underTest.pause();
			layoutCalculator.calls.reset();
		});
		it('ignores any idea updates while it is paused', function () {
			anIdea.updateTitle(1, 'new center');
			expect(layoutCalculator).not.toHaveBeenCalled();
			expect(spy).not.toHaveBeenCalled();
		});
		it('processes all updates when resumed', function () {
			anIdea.updateTitle(1, 'new center');
			anIdea.updateTitle(2, 'new lower left');
			layoutCalculator.and.returnValue({nodes: {1: {title: 'new center', id: 1}, 2: {title: 'new lower left', id: 2}}});
			underTest.resume();
			expect(layoutCalculator).toHaveBeenCalled();
			expect(spy).toHaveBeenCalled();
		});
		it('unpauses when a new idea is loaded', function () {
			anIdea = MAPJS.content({id: 1, title: 'five'});
			underTest.setIdea(anIdea);
			anIdea.updateTitle(1, 'new center');
			expect(layoutCalculator).toHaveBeenCalled();
		});
	});
	describe('dropImage', function () {
		var underTest, layout, idea;
		beforeEach(function () {
			idea = MAPJS.content({id: 1, title: 'one',
				attr: {
					icon: {
						url: 'http://www.google.com',
						width: 100,
						height: 200,
						position: 'center'
					}
				},
				ideas: {1: {id: 2, title: 'two'}}});
			layout = { nodes: { 1: { id: 1, x: 0, y: 100, width: 10, height: 10 }, 2: { id: 2, x: -100, y: 100, width: 10, height: 10} } };
			underTest = new MAPJS.MapModel(function () {
				return JSON.parse(JSON.stringify(layout)); /* deep clone */
			});
			underTest.setIdea(idea);
		});
		describe('when dropped on a node', function () {
			it('sets the node icon and by default positions to the left', function () {
				underTest.dropImage('http://url', 50, 102, -90, 110);
				expect(idea.findSubIdeaById(2).attr.icon).toEqual({
					url: 'http://url',
					width: 50,
					height: 102,
					position: 'left'
				});
			});
			it('replaces an existing icon and keeps the position', function () {
				underTest.dropImage('http://url', 50, 102, 5, 105);
				expect(idea.findSubIdeaById(1).attr.icon).toEqual({
					url: 'http://url',
					width: 50,
					height: 102,
					position: 'center'
				});
			});
			it('scales down huge images to make the view sensible', function () {
				underTest.dropImage('http://url', 500, 1000, -90, 110);
				expect(idea.findSubIdeaById(2).attr.icon).toEqual({
					url: 'http://url',
					width: 150,
					height: 300,
					position: 'left'
				});
			});
		});
		describe('when not dropped on a node', function () {
			beforeEach(function () {
				underTest.dropImage('http://url', 500, 1000, 0, 0);
			});
			it('creates a new node with empty title and image when not dropped on a node', function () {
				var newNode = idea.findSubIdeaById(3);
				expect(newNode).toBeTruthy();
				expect(newNode.title).toEqual('');
				expect(newNode.attr.icon).toEqual({
					url: 'http://url',
					width: 150,
					height: 300,
					position: 'center'
				});
			});
			it('selects the new node', function () {
				expect(underTest.getCurrentlySelectedIdeaId()).toBe(3);
			});

			it('creates a node and adds the image as a batch, so we can undo it', function () {
				idea.undo();
				expect(idea.findSubIdeaById(3)).toBeFalsy();
			});
		});
		it('adds metadata to the icon if specified', function () {
			underTest.dropImage('http://url', 500, 1000, 0, 0, {blob: 'blab'});
			expect(idea.findSubIdeaById(3).attr.icon).toEqual({
				url: 'http://url',
				width: 150,
				height: 300,
				position: 'center',
				metaData: {blob: 'blab'}
			});
		});
	});
	describe('labels', function () {
		var underTest, layout, idea, labelGenerator;
		beforeEach(function () {
			idea = MAPJS.content({id: 1, title: 'one',
				attr: {
					icon: {
						url: 'http://www.google.com',
						width: 100,
						height: 200,
						position: 'center'
					}
				},
				ideas: {1: {id: 2, title: 'two'}}});
			layout = { nodes: {
					1: { id: 1, x: 0, y: 100, width: 10, height: 10 },
					2: { id: 2, x: -100, y: 100, width: 10, height: 10},
					3: {id: 3, x: 10, y: 10, width: 100, height: 50 }
				}
			};
			underTest = new MAPJS.MapModel(function () {
				return JSON.parse(JSON.stringify(layout)); /* deep clone */
			});
			underTest.setIdea(idea);
			labelGenerator = jasmine.createSpy('labelGenerator');
		});
		describe('setLabelGenerator', function () {
			beforeEach(function () {
				labelGenerator.and.returnValue({1: 'l1', 2: 'l2'});
				underTest.setLabelGenerator(labelGenerator);
			});
			it('rebuilds labels for all nodes in layout when generator changed', function () {
				expect(labelGenerator).toHaveBeenCalledWith(idea);
				expect(underTest.getCurrentLayout().nodes[1].label).toBe('l1');
				expect(underTest.getCurrentLayout().nodes[2].label).toBe('l2');
			});
			it('shows numeric 0 labels but not false or empty string or undefined', function () {
				labelGenerator.and.returnValue({1: false, 2: 0, 3: undefined});
				idea.dispatchEvent('changed');
				expect(underTest.getCurrentLayout().nodes[1].label).toBeUndefined();
				expect(underTest.getCurrentLayout().nodes[2].label).toBe(0);
				expect(underTest.getCurrentLayout().nodes[3].label).toBeUndefined();

			});
			it('clears labels for all nodes in layout when generator removed', function () {
				underTest.setLabelGenerator();
				expect(underTest.getCurrentLayout().nodes[1].label).toBeUndefined();
				expect(underTest.getCurrentLayout().nodes[2].label).toBeUndefined();
			});
			it('applies a label generator to all nodes in a layout when the layout changes', function () {
				labelGenerator.and.returnValue({1: 'p1', 2: 'p2'});
				idea.dispatchEvent('changed');
				expect(underTest.getCurrentLayout().nodes[1].label).toBe('p1');
				expect(underTest.getCurrentLayout().nodes[2].label).toBe('p2');
			});
		});
		describe('nodeLabelChanged event', function () {
			it('is dispatched only for attributes where labels actually change on node change', function () {
				var spy;
				labelGenerator.and.returnValue({1: 'l1', 2: 'l2'});
				underTest.setLabelGenerator(labelGenerator);
				labelGenerator.and.returnValue({1: 'x1', 2: 'l2', 3: 'x3'});
				spy = jasmine.createSpy('nodeLabelChangedListener');
				underTest.addEventListener('nodeLabelChanged', spy);
				idea.dispatchEvent('changed');
				expect(spy).toHaveBeenCalledWith(underTest.getCurrentLayout().nodes[1], undefined);
				expect(spy).toHaveBeenCalledWith(underTest.getCurrentLayout().nodes[3], undefined);
				expect(spy.calls.count()).toBe(2);
			});
		});
	});
	describe('getReorderBoundary', function () {
		var underTest, layout, idea, margin,
			firstBoundary = function (nodeId) {
				return underTest.getReorderBoundary(nodeId)[0];
			},
			secondBoundary = function (nodeId) {
				return underTest.getReorderBoundary(nodeId)[1];
			};
		beforeEach(function () {
			idea = MAPJS.content({
					id: 1,
					ideas: {
						1: {
							id: 11
						},
						2: {
							id: 12,
							ideas: {
								1: {id: 121},
								2: {id: 122}
							}
						},
						3: {
							id: 13,
							ideas: {
								1: {id: 131}
							}
						},
						'-1': {
							id: 14,
							ideas: {
								1: {id: 141},
								2: {id: 142}
							}
						},
						'-2': {
							id: 15
						},
						'-3': {
							id: 16
						}
					}
				});
			layout = { nodes: {
					1: { id: 1, x: -50, y: -30, width: 100, height: 60, level: 1, rootId: 1 }, /* ends at x= 50 */
					11: { id: 11, x: 80, y: -100, width: 10, height: 10, level: 2, rootId: 1},
					12: { id: 12, x: 70, y: -60, width: 30, height: 10, level: 2, rootId: 1},  /* ends at x=100 */
					121: { id: 121, x: 115, y: -60, width: 10, height: 11, level: 3, rootId: 1},
					122: { id: 122, x: 135, y: -30, width: 10, height: 10, level: 3, rootId: 1},
					13: { id: 13, x: 70, y: 10, width: 30, height: 20, level: 2, rootId: 1},
					131: {id: 131, x: 120, y: 10, width: 30, height: 20, level: 3, rootId: 1},
					14: { id: 14, x: -100, y: 10, width: 30, height: 10, level: 2, rootId: 1},
					141: { id: 141, x: -150, y: -20, width: 30, height: 10, level: 3, rootId: 1},
					142: { id: 142, x: -160, y: 20, width: 30, height: 10, level: 3, rootId: 1},
					15: { id: 15, x: -80, y: 10, width: 10, height: 10, level: 2, rootId: 1},
					16: { id: 15, x: -80, y: 30, width: 30, height: 30, level: 2, rootId: 1}
				}
			};
			margin = 20;
			underTest = new MAPJS.MapModel(function () {
				return JSON.parse(JSON.stringify(layout)); /* deep clone */
			}, undefined, undefined, margin);
			underTest.setIdea(idea);
		});
		it('returns false for root', function () {
			expect(underTest.getReorderBoundary(1)).toBeFalsy();
		});
		describe('for right nodes', function () {
			it('matches against the left edge', function () {
				_.each([121, 11, 12, 122], function (nodeId) {
					expect(firstBoundary(nodeId).edge).toEqual('left');
				});
			});
			it('returns the right edge of parent + margin', function () {
				expect(firstBoundary(121).x).toEqual(120);
				expect(firstBoundary(11).x).toEqual(70);
				expect(secondBoundary(121).x).toEqual(120);
				expect(secondBoundary(11).x).toEqual(70);
			});
			it('wraps the first boundary around siblings if it has siblings', function () {
				expect(_.pick(firstBoundary(121), 'minY', 'maxY')).toEqual({minY: -61, maxY: 0});
				expect(_.pick(firstBoundary(11), 'minY', 'maxY')).toEqual({minY: -90, maxY: 50});
			});
			it('wraps the second boundary around parent if node has siblings', function () {
				expect(_.pick(secondBoundary(121), 'minY', 'maxY')).toEqual({minY: -91, maxY: -30});
				expect(_.pick(secondBoundary(11), 'minY', 'maxY')).toEqual({minY: -60, maxY: 50});
			});
			it('wraps the first boundary around parent if no siblings', function () {
				expect(_.pick(firstBoundary(131), 'edge', 'x', 'minY', 'maxY')).toEqual({edge: 'left', x: 120, minY: -30, maxY: 50});
				expect(underTest.getReorderBoundary(131).length).toBe(1);
			});
			it('wraps the third boundary over other side siblings for level 1 nodes', function () {
				expect(_.pick(underTest.getReorderBoundary(11)[2], 'edge', 'x', 'minY', 'maxY')).toEqual({edge: 'right', x: -70, minY: -20, maxY: 80});
			});
			it('wraps the fourth boundary over the other side parent for level 1 nodes', function () {
				expect(_.pick(underTest.getReorderBoundary(11)[3], 'edge', 'x', 'minY', 'maxY')).toEqual({edge: 'right', x: -70, minY: -60, maxY: 50});
			});
		});
		describe('for left nodes', function () {
			it('matches against the right edge', function () {
				_.each([14, 141, 142, 15, 16], function (nodeId) {
					expect(firstBoundary(nodeId).edge).toEqual('right');
				});
			});
			it('returns the left edge of parent - margin', function () {
				expect(firstBoundary(141).x).toEqual(-120);
				expect(firstBoundary(14).x).toEqual(-70);
			});
			it('wraps the first boundary around siblings', function () {
				expect(_.pick(firstBoundary(141), 'minY', 'maxY')).toEqual({minY: -10, maxY: 50});
				expect(_.pick(firstBoundary(15), 'minY', 'maxY')).toEqual({minY: -20, maxY: 80});
			});
		});
	});
	describe('focusAndSelect', function () {
		var underTest, anIdea, listener;
		beforeEach(function () {
			anIdea = MAPJS.content({
				id: 1,
				title: 'root',
				ideas: {
					10: {
						id: 2,
						title: 'child',
						ideas: {
							11: { id: 3, title: 'child of child' }
						}
					}
				}
			});
			underTest = new MAPJS.MapModel(function () {
				return {
					nodes: {1: {level: 1}, 2: {level: 2}, 3: {level: 3}}
				};
			});
			underTest.setIdea(anIdea);
			listener = jasmine.createSpy();
			underTest.selectNode(1);
		});
		it('selects the node', function () {
			underTest.addEventListener('nodeSelectionChanged', listener);
			underTest.focusAndSelect(2);
			expect(listener).toHaveBeenCalledWith(2, true);
		});
		it('dispatches nodeFocusRequested for the node', function () {
			underTest.addEventListener('nodeFocusRequested', listener);
			underTest.focusAndSelect(2);
			expect(listener).toHaveBeenCalledWith(2);
		});
	});
	describe('contextForNode', function () {
		var underTest, anIdea, clipboard,
				layoutCalculator = function () {
				return {
					nodes: {1: {level: 1}, 2: {level: 2}, 3: {level: 3}}
				};
			};
		beforeEach(function () {
			anIdea = MAPJS.content({
				id: 1,
				title: 'root',
				ideas: {
					10: {
						id: 2,
						title: '1st child',
						ideas: {
							11: { id: 3, title: '1st child of 1st child' },
							12: { id: 5, title: '2nd child of 1st child' }
						}
					},
					'-12': {
						id: 4,
						title: '2nd child',
						attr: {
							collapsed: true
						},
						ideas: {
							11: { id: 6, title: '1st child of 2nd child' }
						}
					}
				}
			});
			clipboard = new MAPJS.MemoryClipboard();
			underTest = new MAPJS.MapModel(layoutCalculator, undefined, clipboard);
			underTest.setIdea(anIdea);
		});
		it('should be undefined when there is no node for node id', function () {
			expect(underTest.contextForNode(20)).toBeUndefined();
		});
		it('should have canCollapse for expanded nodes with children', function () {
			expect(underTest.contextForNode(2).canCollapse).toBeTruthy();
		});
		it('should not have canExpand for expanded nodes with children', function () {
			expect(underTest.contextForNode(2).canExpand).toBeFalsy();
		});

		it('should have canExpand for collapsed nodes with children', function () {
			expect(underTest.contextForNode(4).canExpand).toBeTruthy();
		});
		it('should not have canCollapse for collapsed nodes with children', function () {
			expect(underTest.contextForNode(4).canCollapse).toBeFalsy();
		});
		it('should not have canCollapse or canExpand for nodes without children', function () {
			expect(underTest.contextForNode(3).canExpand).toBeFalsy();
			expect(underTest.contextForNode(3).canCollapse).toBeFalsy();
		});
		describe('notLastRoot', function () {
			describe('when there is a single root', function () {
				it('should be true if selected node is not root', function () {
					expect(underTest.contextForNode(2).notLastRoot).toBeTruthy();
				});
				it('should be false if selected node is a root node', function () {
					expect(underTest.contextForNode(1).notLastRoot).toBeFalsy();
				});
			});
			describe('when there are multiple roots', function () {
				beforeEach(function () {
					anIdea.addSubIdea('root', 'new root');
				});
				it('should be true if selected node is not root', function () {
					expect(underTest.contextForNode(2).notLastRoot).toBeTruthy();
				});
				it('should be true if selected node is a root node', function () {
					expect(underTest.contextForNode(1).notLastRoot).toBeTruthy();
				});
			});
		});
		describe('canPaste', function () {
			it('should be false when clipboard is empty', function () {
				expect(underTest.contextForNode(1).canPaste).toBe(false);
			});
			describe('when clipboard is not empty', function () {
				beforeEach(function () {
					clipboard.put('hoo har');
				});
				it('should be true when editing is enabled', function () {
					expect(underTest.contextForNode(1).canPaste).toBe(true);
				});
				it('should be false when editing is disabled', function () {
					underTest.setEditingEnabled(false);
					expect(underTest.contextForNode(1).canPaste).toBe(false);
				});
			});
		});
		describe('hasChildren', function () {
			it('should be true when the node has children', function () {
				expect(underTest.contextForNode(1).hasChildren).toBe(true);
				expect(underTest.contextForNode(2).hasChildren).toBe(true);
				expect(underTest.contextForNode(4).hasChildren).toBe(true);
			});
			it('should be false when the node does not have children', function () {
				expect(underTest.contextForNode(3).hasChildren).toBe(false);
				expect(underTest.contextForNode(5).hasChildren).toBe(false);
				expect(underTest.contextForNode(6).hasChildren).toBe(false);
			});
		});
		describe('hasSiblings', function () {
			it('should be true when the node has siblings', function () {
				expect(underTest.contextForNode(2).hasSiblings).toBe(true);
				expect(underTest.contextForNode(3).hasSiblings).toBe(true);
				expect(underTest.contextForNode(4).hasSiblings).toBe(true);
				expect(underTest.contextForNode(5).hasSiblings).toBe(true);
			});
			it('should be false when the node does not have siblings', function () {
				expect(underTest.contextForNode(1).hasSiblings).toBe(false);
				expect(underTest.contextForNode(6).hasSiblings).toBe(false);
			});

		});
		describe('notRoot', function () {
			it('should be false when the node is root', function () {
				expect(underTest.contextForNode(1).notRoot).toBe(false);
			});
			it('should be true when the node is not root', function () {
				expect(underTest.contextForNode(2).notRoot).toBe(true);
				expect(underTest.contextForNode(3).notRoot).toBe(true);
				expect(underTest.contextForNode(4).notRoot).toBe(true);
				expect(underTest.contextForNode(5).notRoot).toBe(true);
				expect(underTest.contextForNode(6).notRoot).toBe(true);
			});
		});
		describe('canUndo', function () {
			it('should be false before first change', function () {
				expect(underTest.contextForNode(1).canUndo).toBe(false);
			});
			it('should be true when the idea can run an undo', function () {
				underTest.updateTitle(1, 'changed');
				expect(underTest.contextForNode(1).canUndo).toBe(true);
			});
			it('should be false when the idea can not run an undo any more', function () {
				underTest.updateTitle(1, 'changed');
				underTest.undo();
				expect(underTest.contextForNode(1).canUndo).toBe(false);
			});
			it('should be true if there are changes in the queue even after an undo', function () {
				underTest.updateTitle(1, 'changed');
				underTest.updateTitle(1, 'changed again');
				underTest.undo();
				expect(underTest.contextForNode(1).canUndo).toBe(true);
			});
		});
		describe('canRedo', function () {
			it('should be false before first change', function () {
				expect(underTest.contextForNode(1).canRedo).toBe(false);
			});
			it('should be false before first undo', function () {
				underTest.updateTitle(1, 'changed');
				expect(underTest.contextForNode(1).canRedo).toBe(false);
			});
			it('should be true when the idea after an undo', function () {
				underTest.updateTitle(1, 'changed');
				underTest.undo();
				expect(underTest.contextForNode(1).canRedo).toBe(true);
			});
			it('should be false when the idea can not run an redo any more', function () {
				underTest.updateTitle(1, 'changed');
				underTest.undo();
				underTest.redo();
				expect(underTest.contextForNode(1).canRedo).toBe(false);
			});
			it('should be true when there are still redos possible in case of multiple operations', function () {
				underTest.updateTitle(1, 'changed');
				underTest.updateTitle(1, 'changed again');
				underTest.undo();
				underTest.undo();
				underTest.redo();
				expect(underTest.contextForNode(1).canRedo).toBe(true);
			});
		});

	});
	describe('requestContextMenu', function () {
		var underTest, anIdea, listener;
		beforeEach(function () {
			anIdea = MAPJS.content({
				id: 1,
				title: 'root',
				ideas: {
					10: {
						id: 2,
						title: 'child',
						ideas: {
							11: { id: 3, title: 'child of child' }
						}
					}
				}
			});
			underTest = new MAPJS.MapModel(function () {
				return {
					nodes: {1: {level: 1}, 2: {level: 2}, 3: {level: 3}}
				};
			});
			underTest.setIdea(anIdea);
			listener = jasmine.createSpy('contextMenuRequested');
			underTest.addEventListener('contextMenuRequested', listener);
			underTest.selectNode(3);
		});
		it('dispatches contextMenuRequested with the currently selected idea and coordinates from the argument', function () {
			var result = underTest.requestContextMenu(100, 300);
			expect(result).toBeTruthy();
			expect(listener).toHaveBeenCalledWith(3, 100, 300);
		});
		it('does not dispatch event if input is disabled', function () {
			var result;
			underTest.setInputEnabled(false);
			result = underTest.requestContextMenu(100, 300);
			expect(result).toBeFalsy();
			expect(listener).not.toHaveBeenCalled();
		});
		it('does not dispatch event if editing is disabled', function () {
			var result;
			underTest.setEditingEnabled(false);
			result = underTest.requestContextMenu(100, 300);
			expect(result).toBeFalsy();
			expect(listener).not.toHaveBeenCalled();
		});
	});
	describe('root node operations', function () {
		var underTest, anIdea;
		beforeEach(function () {
			anIdea = MAPJS.content({
				id: 1,
				title: 'root',
				ideas: {
					10: {
						id: 2,
						title: 'child',
						ideas: {
							11: { id: 3, title: 'child of child' }
						}
					}
				}
			});
			underTest = new MAPJS.MapModel(function () {
				return {
					nodes: {1: {level: 1}, 2: {level: 2}, 3: {level: 3}}
				};
			});
			underTest.setIdea(anIdea);
		});
		describe('makeSelectedNodeRoot', function () {
			beforeEach(function () {
				spyOn(anIdea, 'changeParent').and.callThrough();
			});
			it('should change the parent of the selected node to the content aggregate root node', function () {
				underTest.selectNode(2);
				underTest.makeSelectedNodeRoot();
				expect(anIdea.changeParent).toHaveBeenCalledWith(2, 'root');
			});
			it('should not change the parent of a node that is alread a root node', function () {
				underTest.selectNode(1);
				underTest.makeSelectedNodeRoot();
				expect(anIdea.changeParent).not.toHaveBeenCalled();
			});
			it('should change the parent of the selected node expec when input is disabled', function () {
				underTest.selectNode(2);
				underTest.setInputEnabled(false);
				underTest.makeSelectedNodeRoot();
				expect(anIdea.changeParent).not.toHaveBeenCalled();
			});
			it('should change the parent of the selected node expec when editing is disabled', function () {
				underTest.selectNode(2);
				underTest.setEditingEnabled(false);
				underTest.makeSelectedNodeRoot();
				expect(anIdea.changeParent).not.toHaveBeenCalled();
			});

		});
		describe('insertRoot', function () {
			var nodeEditRequestedListener;
			beforeEach(function () {
				nodeEditRequestedListener = jasmine.createSpy('node edit requested');
				underTest.addEventListener('nodeEditRequested', nodeEditRequestedListener);
				spyOn(anIdea, 'addSubIdea').and.callThrough();
			});
			it('inserts a new root node as a sub idea of the aggregate root node', function () {
				underTest.insertRoot('source');
				expect(anIdea.addSubIdea).toHaveBeenCalledWith('root');
				expect(nodeEditRequestedListener).toHaveBeenCalledWith(4, true, true);
				expect(underTest.getSelectedNodeId()).toBe(4);
			});
			it('should add with a title and select but not invoke editNode if title is supplied', function () {
				underTest.insertRoot('source', 'initial title');
				expect(anIdea.addSubIdea).toHaveBeenCalledWith('root', 'initial title');
				expect(nodeEditRequestedListener).not.toHaveBeenCalled();
				expect(underTest.getSelectedNodeId()).toBe(4);
			});

		});

	});

});
