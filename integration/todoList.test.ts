import { expect } from 'chai';

import { setupReview, conductAllReviews } from '../src/review';
import { ITodoItem, TodoState } from '../src/todoItem';
import { listToMarks, undotAll, getCMWTD } from '../src/todoList';
import { FRUITS, makeNItemArray } from '../unit/test-util';

describe('TODO LIST INTEGRATION TESTS', () => {
	describe('List to marks function', () => {
		it('should return a list of items marked `[o] [ ]` for a given list', () => {
			const todoList: ITodoItem[] = makeNItemArray(2);
			todoList[0].state = TodoState.Marked;
			expect(listToMarks(todoList)).equals("[o] [ ]");
		})
	})

	describe('Conducting list iteration', () => {
		it('should correctly update CMWTD for input `[n, y]` ', () => {
			let todoList: ITodoItem[] = makeNItemArray(3);
			const lastDone = "";
			todoList = setupReview(todoList);
			todoList = conductAllReviews(todoList, lastDone, ['n', 'y']);
			expect(getCMWTD(todoList)).equals(FRUITS[2]);
		});
	})

	describe('Undotting all items', () => {
		it('undots list of dotted, undotted, & completed items', () => {
			let todoList: ITodoItem[] = makeNItemArray(3);
			todoList[0].state = TodoState.Completed;
			todoList[1].state = TodoState.Marked;
			todoList = undotAll(todoList);
			expect(todoList[0].state).equals(TodoState.Completed);
			expect(todoList[1].state).equals(TodoState.Unmarked);
			expect(todoList[2].state).equals(TodoState.Unmarked);
		})
	})
});