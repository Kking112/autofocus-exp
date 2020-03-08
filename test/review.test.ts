import { expect } from 'chai';

import { conductReviews, getFirstUnmarked, readyToReview, setupReview } from '../src/review';
import { constructNewTodoItem, ITodoItem, TodoState } from '../src/todoItem';
import { addTodoToList, listToMarks } from '../src/todoList';

describe('Review Mode', ()=> {
	describe('Reviewing zero item lists',() => {
		// when there are no todo items, does not affect the todo list or cmwtd
		it('returns back an empty list', () => {
			let todoList: ITodoItem[] = [];
			let cmwtd = "";
			[todoList, cmwtd] = setupReview(todoList, cmwtd); // "There are no todo items."
			[todoList, cmwtd] = conductReviews(todoList, cmwtd, []); // "There are no todo items."
			expect(todoList.length).equals(0);
			expect(cmwtd).equals("");
		})
	})
	
	describe('Reviewing one item lists',()=> {
		it('immediately returns back lists with no unmarked items as is',() => {
			// make a list with one marked item
			let todoList: ITodoItem[] = [];
			let cmwtd = "";
			const item1: ITodoItem = constructNewTodoItem("apple");
			todoList = addTodoToList(todoList,item1);
			todoList[0].state = TodoState.Marked;
			[todoList, cmwtd] = setupReview(todoList, cmwtd);
			expect(todoList.length).equals(1);
			expect(cmwtd).equals("");
			
		})
	
		it('immediately returns back lists with one unmarked item now marked',()=>{
			// make a list with one unmarked item
			let todoList: ITodoItem[] = [];
			let cmwtd = "";
			const item1: ITodoItem = constructNewTodoItem("apple");
			todoList = addTodoToList(todoList,item1);
			[todoList, cmwtd] = setupReview(todoList, cmwtd);
			expect(todoList.length).equals(1);
			expect(cmwtd).equals("apple");
		})
	})
	
	describe('Reviewing two item lists',()=> {
		// doesn't affect the list if all items are dotted to begin with
		it('returns back lists with no unmarked items as is',() => {
			// make a list with one marked, one complete
			let todoList: ITodoItem[] = [];
			let cmwtd = "";
			const item1: ITodoItem = constructNewTodoItem("apple");
			const item2: ITodoItem = constructNewTodoItem("banana");
			todoList = addTodoToList(todoList,item1);
			todoList = addTodoToList(todoList,item2);
			todoList[0].state = TodoState.Marked;
			todoList[1].state = TodoState.Marked;
			[todoList, cmwtd] = setupReview(todoList, cmwtd); // "There are no ready items."
			[todoList, cmwtd] = conductReviews(todoList, cmwtd, []); // "There are no ready items."
			expect(todoList.length).equals(2);
			expect(cmwtd).equals("");
		})
	
		// todo: use firstReady function
		// logic: if firstReady is marked, do nothing.
		// logic continued: if firstReady is not marked, mark it
		it('doesn\'t affect lists where the first non-complete, non-archived item is already marked',()=>{
			// returns back first non-complete, non-archived "ready" item as marked
			let todoList: ITodoItem[] = [];
			let cmwtd = "";
			const item1: ITodoItem = constructNewTodoItem("apple");
			const item2: ITodoItem = constructNewTodoItem("banana");
			todoList = addTodoToList(todoList,item1);
			todoList = addTodoToList(todoList,item2);
			todoList[0].state = TodoState.Completed;
			todoList[1].state = TodoState.Marked;
			[todoList, cmwtd] = setupReview(todoList, cmwtd);
			expect(todoList[1].state).equals(TodoState.Marked);
		})
	
		// should result in the first item being dotted if it wasn't already
		it('modifies lists where the first item is not marked', () => {
				let todoList: ITodoItem[] = [];
				let cmwtd = "";
				const item1: ITodoItem = constructNewTodoItem("apple");
				const item2: ITodoItem = constructNewTodoItem("banana");
				todoList = addTodoToList(todoList,item1);
				todoList = addTodoToList(todoList,item2);
				[todoList, cmwtd] = setupReview(todoList, cmwtd);
				expect(todoList[0].state).equals(TodoState.Marked);
		})
	
		// todo: use firstReady function
		// should marked the first non-complete, non-archived item
		it('modifies lists where the first non-complete, non-archived item is not marked',()=>{
			// returns back first non-complete, non-archived "ready" item as UNmarked
			let todoList: ITodoItem[] = [];
			let cmwtd = "";
			const item1: ITodoItem = constructNewTodoItem("apple");
			const item2: ITodoItem = constructNewTodoItem("banana");
			todoList = addTodoToList(todoList,item1);
			todoList = addTodoToList(todoList,item2);
			todoList[1].state = TodoState.Completed;
			[todoList, cmwtd] = setupReview(todoList, cmwtd);
			expect(todoList[0].state).equals(TodoState.Marked);
			expect(todoList[1].state).equals(TodoState.Completed);
		})
	})
	
	describe('Finding unmarked todos', () => {
		it('returns the first unmarked item', () => {
			let todoList: ITodoItem[] = [];
			const item1: ITodoItem = constructNewTodoItem("apple");
			const item2: ITodoItem = constructNewTodoItem("banana");
			todoList = addTodoToList(todoList,item1);
			todoList = addTodoToList(todoList,item2);
			todoList[0].state = TodoState.Completed;
			expect(getFirstUnmarked(todoList)).equals(1);
		})
	
		it('returns -1 when there are no todos', () => {
			const todoList: ITodoItem[] = [];
			expect(getFirstUnmarked(todoList)).equals(-1);
		});
	
		it('returns -1 when there are no unmarked todos', () => {
			let todoList: ITodoItem[] = [];
			const item1: ITodoItem = constructNewTodoItem("apple");
			const item2: ITodoItem = constructNewTodoItem("banana");
			todoList = addTodoToList(todoList,item1);
			todoList = addTodoToList(todoList,item2);
			todoList[0].state = TodoState.Completed;
			todoList[1].state = TodoState.Completed;
			expect(getFirstUnmarked(todoList)).equals(-1);
		});
	
		it('when there are both marked and unmarked items, returns the unmarked item', () => {
			let todoList: ITodoItem[] = [];
			const item1: ITodoItem = constructNewTodoItem("apple");
			const item2: ITodoItem = constructNewTodoItem("banana");
			todoList = addTodoToList(todoList,item1);
			todoList = addTodoToList(todoList,item2);
			todoList[0].state = TodoState.Marked;
			todoList[1].state = TodoState.Unmarked;
			expect(getFirstUnmarked(todoList)).equals(1);
		})
	});
	
	describe('Attempting to conduct reviews', ()=> {
		it('when there are no unmarked or ready items, doesn\'t affect the todo list or cmwtd', () => {
			let todoList: ITodoItem[] = [];
			let cmwtd = "";
			const item1: ITodoItem = constructNewTodoItem("apple");
			const item2: ITodoItem = constructNewTodoItem("banana");
			todoList = addTodoToList(todoList,item1);
			todoList = addTodoToList(todoList,item2);
			todoList[0].state = TodoState.Completed;
			todoList[1].state = TodoState.Completed;
			[todoList, cmwtd] = setupReview(todoList, cmwtd); // "There are no ready items."
			[todoList, cmwtd] = conductReviews(todoList, cmwtd, []); // "There are no ready items."
			expect(todoList.length).equals(2);
			expect(cmwtd).equals("");
		});
	
		it('should return a list of items marked `[o] [ ] [o]` for input `n, y` ', () => {
			let todoList: ITodoItem[] = [];
			let cmwtd = "";
			const item1: ITodoItem = constructNewTodoItem("apple");
			const item2: ITodoItem = constructNewTodoItem("banana");
			const item3: ITodoItem = constructNewTodoItem("cherry");
			todoList = addTodoToList(todoList,item1);
			todoList = addTodoToList(todoList,item2);
			todoList = addTodoToList(todoList,item3);
			[todoList, cmwtd] = setupReview(todoList, cmwtd);
			[todoList, cmwtd] = conductReviews(todoList, cmwtd, ['n', 'y']);
			expect(cmwtd).equals("cherry");
			expect(listToMarks(todoList)).equals("[o] [ ] [o]");
		});

		it('should return a list of items marked `[o] [ ] [ ]` for input `n, n` ', () => {
			let todoList: ITodoItem[] = [];
			let cmwtd = "";
			const item1: ITodoItem = constructNewTodoItem("apple");
			const item2: ITodoItem = constructNewTodoItem("banana");
			const item3: ITodoItem = constructNewTodoItem("cherry");
			todoList = addTodoToList(todoList,item1);
			todoList = addTodoToList(todoList,item2);
			todoList = addTodoToList(todoList,item3);
			[todoList, cmwtd] = setupReview(todoList, cmwtd);
			[todoList, cmwtd] = conductReviews(todoList, cmwtd, ['n', 'n']);
			expect(cmwtd).equals("apple");
			expect(listToMarks(todoList)).equals("[o] [ ] [ ]");
		});
	});
	
	describe('Review mode list iteration', () => {
		it('enables determining when reviewing is not possible because no reviewable items exist', () => {
			let todoList: ITodoItem[] = [];
			const item1: ITodoItem = constructNewTodoItem("apple");
			const item2: ITodoItem = constructNewTodoItem("banana");
			todoList = addTodoToList(todoList,item1);
			todoList = addTodoToList(todoList,item2);
			todoList[0].state = TodoState.Completed;
			todoList[1].state = TodoState.Completed;
			expect(readyToReview(todoList)).equals(false);
		})
	
		it('correctly finds the first ready todo item', () => {
			let todoList: ITodoItem[] = [];
			const item1: ITodoItem = constructNewTodoItem("apple");
			const item2: ITodoItem = constructNewTodoItem("banana");
			const item3: ITodoItem = constructNewTodoItem("cherry");
			todoList = addTodoToList(todoList,item1);
			todoList = addTodoToList(todoList,item2);
			todoList = addTodoToList(todoList,item3);
			todoList[0].state = TodoState.Completed;
			todoList[1].state = TodoState.Completed;
			expect(readyToReview(todoList)).equals(true);
		})
	})
});

// describe('',()=> {
// 	it('',()=>{
// 		print();
// 	})
// })