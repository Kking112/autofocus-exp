import readlineSync from 'readline-sync';

import {constructNewTodoItem, getMark, ITodoItem, TodoState} from './todoItem';

import {generalPrint, printTodoItemCount, printUpdate } from './cli';

const APP_NAME = 'AutoFocus';
const newItemTitlePrompt = `Enter todo item name \
(ie. wash the dishes). Enter 'Q' to quit: `;
//// 113. const newItemBodyPrompt = "Give your todo item a comment (ie. use \
//// dishwasher for non-glass items) or hit ENTER key to skip: ";
const menuPrompt = 'Please choose from the menu above:';

export const greetUser = (word: string = APP_NAME): string => {
  return `Welcome to ${APP_NAME}!`;
}

enum MainMenuChoice {
	AddNew = 'Add a New Todo',
	ReviewTodos = 'Review & Dot Todos',
	EnterFocus = 'Enter Focus Mode',
	ReadAbout = 'Read About AutoFocus',
	Quit = 'Quit Program'
}

const menuChoices: MainMenuChoice[] = [
	MainMenuChoice.AddNew,
	MainMenuChoice.ReviewTodos,
	MainMenuChoice.EnterFocus,
	MainMenuChoice.ReadAbout,
	MainMenuChoice.Quit];

const promptUserWithMainMenu = (): MainMenuChoice => {
	return menuChoices[
		readlineSync.keyInSelect(menuChoices, menuPrompt, {cancel: false})];
}

const promptUserForYNQ = (questionString: string): string => {
	return readlineSync.question(questionString, 
		{limit: ['y','n','q','Y','N','Q']}).toLowerCase();
}

const promptUserForNewTodoItemCLI = (): ITodoItem | null => {
	const headerText = readlineSync.question(newItemTitlePrompt, {
		limit: /\w+/i,
		limitMessage: 'Sorry, $<lastInput> is not a valid todo item title'
	}); // prevent empty input
	//// 113. let bodyText = "";
	if(headerText.toLowerCase() === 'q') {
		return null;
	} else {
		//// 113. bodyText = readlineSync.question(newItemBodyPrompt);
		// issue: Dev implements momentjs datetime #103
		// issue: Dev implements ITodoItem uuid #104
		const newItem: ITodoItem = constructNewTodoItem(
			headerText, ""); //// 113. bodyText

		generalPrint(`New todo item '${newItem.header}' successfully created!`);

		return newItem;
	}
}

export const indexOfItem = (list: any[], attr: any, val: any): number => {
	return list.map((e) => e[attr]).indexOf(val);
}

export const itemExists = (list: any[], attr: any, val: any): boolean => {
	return indexOfItem(list, attr, val) !== -1;
}

// issue: Dev fixes getFirstReadyTodo bug #200
// note: either indicies could be -1...
export const getFirstReadyTodo = (todoList: ITodoItem[]): number => {
	const firstUnmarkedIndex = indexOfItem(todoList, "state", TodoState.Unmarked);
	const firstMarkedIndex = indexOfItem(todoList, "state", TodoState.Marked);
	if (firstUnmarkedIndex === -1) {
		return firstMarkedIndex;
	} else if (firstMarkedIndex === -1) {
		return firstUnmarkedIndex;
	} else {
		return Math.min(firstMarkedIndex, firstUnmarkedIndex)
	}
}

export const setupReview = (todoList: ITodoItem[], cmwtd: string): any => {
	// FVP step 1: dot the first ready todo item (the first non-complete, non-archived item)
	const readyTodo = getFirstReadyTodo(todoList);
	todoList[readyTodo].state = TodoState.Marked;
	// issue: Architect decides how to manage todo items in backend #108
	if(cmwtd === "" || cmwtd === null) {
		cmwtd = todoList[readyTodo].header; // CMWTD is initialized to first ready todo item if unset // issue: Dev fixes issue where first item is perma-marked #116
	}
	return [todoList, cmwtd];
}

export const conductReviews = (todoList: ITodoItem[], cmwtd: string, answers: string[]): any => {
	// FVP step 2: user story: User is asked to answer yes, no, or quit per review item #170
	for(let i = 0; i < todoList.length - 1; i++) {
		const next = todoList[i+1].header;
		const ans = answers[i];
		if(ans === 'y') {
			todoList[i+1].state = TodoState.Marked;
			cmwtd = next; // issue: Architect decides how to manage todo items in backend #108
		}
		if(ans === 'n') {
			// do nothing, and pass
		}
		if(ans === 'q') {
			break;
		}
	}
	return [todoList, cmwtd];
}

const getReviewAnswersCLI = (todoList: ITodoItem[], cmwtd: string): string[] => {
	const answers: string[] = [];
	for(let i = 0; i < todoList.length - 1; i++) {
		const next = todoList[i+1].header;
		const ans = promptUserForYNQ(`Do you want to '${next}' more than '${cmwtd}'? (Y/N/Q) `);
		if(ans === 'y') {
			answers.push('y');
		}
		if(ans === 'n') {
			answers.push('n');
		}
		if(ans === 'q') {
			answers.push('q');
			break;
		}
	}
	return answers;
}

export const conductFocus = (todoList: ITodoItem[], cmwtd: string, response: any): any => {
	const workLeft: string = response.workLeft; // this will be either 'y' or 'n'
	if(workLeft === 'y') {
		[todoList, cmwtd] = duplicateCMWTD(todoList, cmwtd);
	}
	[todoList, cmwtd] = markCMWTDdone(todoList, cmwtd);
	return [todoList, cmwtd];
};

const markCMWTDdone = (todoList: ITodoItem[], cmwtd: string): any => {
	// note: since cmwtd is current saved as a string, string lookup
	// of todo items is the way to find the cmwtd in the todoItem list
	let searching = true;
	let i = 0;
	while(searching) {
		// find an item that matches the header text of the
		// current-most-want-to-do AND hasn't been completed yet
		if(todoList[i].header === cmwtd && todoList[i].state !== TodoState.Completed) {
			todoList[i].state = TodoState.Completed;
			searching = false;
		}
		i = i+1;
		// issue: Dev adds out of bounds check for markCMWTDdone #201
		// issue: Dev implements reset of CMWTD item #171
	}
	return [todoList, cmwtd];
}

const duplicateCMWTD = (todoList: ITodoItem[], cmwtd: string): any => {
	const newItem: ITodoItem = constructNewTodoItem(
		cmwtd, "")
	todoList.push(newItem);
	return [todoList, cmwtd];
}

const enterFocusCLI = (todoList: ITodoItem[], cmwtd: string): any => {
	// 1. clear the console view
	// tslint:disable-next-line:no-console
	console.clear();

	// 2. show the current todo item
	generalPrint(`You are working on '${cmwtd}'`);

	// 3. wait for any key to continue
	readlineSync.keyInPause();

	// 4. ask the user if they have work left to do on current item
	// If there is work left to do on the cmwtd item, a duplicate issue is created.
	const response: any = { workLeft: "n"};
	if(promptUserForYNQ(`Do you have work left to do on this item?`) === 'y') {
		response.workLeft = 'y';
	}

	// 5. mark the cmwtd item as done
	[todoList, cmwtd] = conductFocus(todoList, cmwtd, response);

	return [todoList, cmwtd];
}

export const addTodoToList = (todoList: ITodoItem[], newTodoItem: ITodoItem): ITodoItem[] => {
	todoList.push(newTodoItem);
	return todoList;
}

const addNewCLI = (todoList: ITodoItem[], cmwtd: string): any => {
	const temp: ITodoItem | null = promptUserForNewTodoItemCLI();
	if(temp !== null) {
		todoList = addTodoToList(todoList,temp);
		// issue: Dev implements todo item store using redux pattern #106
	}

	return [todoList, cmwtd];
}

export const readyToReview = (todoList: ITodoItem[]): boolean => {
	const containsUnmarked = itemExists(todoList, "state", TodoState.Unmarked);
	const containsMarked = itemExists(todoList, "state", TodoState.Marked);
	return containsMarked || containsUnmarked;
}

const attemptReviewTodosCLI = (todoList: ITodoItem[], cmwtd: string): any => {
	// step 0: check to see if there are any non-complete, non-archived items
	if(readyToReview(todoList)) {
		// issue: Dev handles for list review when there are 2 or less items #107
		// issue: Architect designs option to always quit mid-menu #109
		// issue: Dev implements E2E test for CLA #110
		// issue: Dev implements todo item store using redux pattern #106
		[ todoList, cmwtd ] = setupReview(todoList, cmwtd);
		const answers = getReviewAnswersCLI(todoList, cmwtd);
		[ todoList, cmwtd ] = conductReviews(todoList, cmwtd, answers);
		printUpdate( todoList, cmwtd);
	}
	return [todoList, cmwtd];
}

export const listToMarks = (todoList: ITodoItem[]): string => {
	return todoList.map(x => getMark(x)).join(" ");
}

export const mainCLI = ():void => {
	generalPrint(greetUser());

	let todoList: ITodoItem[] = [];
	let cmwtd: string = "";

	let running = true;
	while(running) {
		const answer = promptUserWithMainMenu();
		// issue: Dev refactors multi if blocks #125
		if(answer === MainMenuChoice.AddNew) {
			[ todoList, cmwtd ] = addNewCLI(todoList, cmwtd);
			printTodoItemCount(todoList);
		}
		if(answer === MainMenuChoice.ReviewTodos) {
			[todoList, cmwtd] = attemptReviewTodosCLI(todoList, cmwtd);
		}
		if(answer === MainMenuChoice.EnterFocus) {
			[ todoList, cmwtd ] = enterFocusCLI(todoList, cmwtd);
		}
		// issue: Dev adds about section text print out #128
		if(answer === MainMenuChoice.ReadAbout) {
			generalPrint("This is stub (placeholder) text. Please check back later.");
		}
		if(answer === MainMenuChoice.Quit) {
			running = false;
		}
	}
	
	generalPrint("Have a nice day!");
}