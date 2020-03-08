import readlineSync from 'readline-sync';

import { conductFocus } from './focus';
import { greetUser } from './main';
import { conductReviews, readyToReview, setupReview } from './review';
import { constructNewTodoItem, ITodoItem } from './todoItem';
import { addTodoToList, makePrintableTodoItemList } from './todoList';
import { getPluralS } from './util';

// ****************************************
// PROMPTS
// ****************************************

const newItemTitlePrompt = `Enter todo item name \
(ie. wash the dishes). Enter 'Q' to quit: `;
//// 113. const newItemBodyPrompt = "Give your todo item a comment (ie. use \
//// dishwasher for non-glass items) or hit ENTER key to skip: ";
const menuPrompt = 'Please choose from the menu above:';

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

export const promptUserWithMainMenu = (): MainMenuChoice => {
	return menuChoices[
		readlineSync.keyInSelect(menuChoices, menuPrompt, {cancel: false})];
}

export const promptUserForYNQ = (questionString: string): string => {
	return readlineSync.question(questionString, 
		{limit: ['y','n','q','Y','N','Q']}).toLowerCase();
}

export const promptUserForNewTodoItemCLI = (): ITodoItem | null => {
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

export const waitForKeyPress = () => {
	readlineSync.keyInPause(); // issue: Dev fixes ENTER key not quitting/ending focus mode #217
}

// ****************************************
// PRINT FUNCTIONS
// ****************************************

export const generalPrint = (s: string): void => {
	// tslint:disable-next-line:no-console
	console.log(s);
}

export const printTodoItemCount = (list: ITodoItem[]):void => {
	generalPrint(`You have ${list.length} todo item${getPluralS(list.length)}.`);
}

const printTodoItemList = (list: ITodoItem[]):void => {
	generalPrint(makePrintableTodoItemList(list));
}

export const printUpdate = (todoList: ITodoItem[], cmwtd: string): void => {
	generalPrint(`Your current most want to do is '${cmwtd}'.`);
	generalPrint("Your current Todo List:")
	printTodoItemList(todoList);
}

// ****************************************
// REVIEWING
// ****************************************

// issue: Dev refactors getReviewAnswersCLI #216
export const getReviewAnswersCLI = (todoList: ITodoItem[], cmwtd: string): string[] => {
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

const attemptReviewTodosCLI = (todoList: ITodoItem[], cmwtd: string): any => {
	if(todoList.length === 0) {
		generalPrint("There are no items to review. Please enter a todo item and try again.");
		return [todoList, cmwtd];
	}
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

// ****************************************
// FOCUS MODE
// ****************************************

const enterFocusCLI = (todoList: ITodoItem[], cmwtd: string): any => {
	// 0. confirm that focusMode can be safely entered
	if(todoList.length === 0) {
		generalPrint("There are no todo items. Please enter todo items and try again.");
		return [todoList, cmwtd];
	}
	if(cmwtd === "") {
		generalPrint("There is no 'current most want to do' item. Please review your items and try again.");
		return [todoList, cmwtd];
	}
	
	// 1. clear the console view
	// tslint:disable-next-line:no-console
	console.clear();

	// 2. show the current todo item
	generalPrint(`You are working on '${cmwtd}'`);

	// 3. wait for any key to continue
	waitForKeyPress();

	// 4. ask the user if they have work left to do on current item
	// If there is work left to do on the cmwtd item, a duplicate issue is created.
	const response: any = { workLeft: "n"}; // initialize default "no" workLeft response
	if(promptUserForYNQ(`Do you have work left to do on this item?`) === 'y') {
		response.workLeft = 'y';
	}

	// 5. mark the cmwtd item as done
	[todoList, cmwtd] = conductFocus(todoList, cmwtd, response);

	return [todoList, cmwtd];
}

const addNewCLI = (todoList: ITodoItem[], cmwtd: string): any => {
	const temp: ITodoItem | null = promptUserForNewTodoItemCLI();
	if(temp !== null) {
		todoList = addTodoToList(todoList,temp);
		// issue: Dev implements todo item store using redux pattern #106
	}

	return [todoList, cmwtd];
}

// ****************************************
// MAIN PROGRAM LOOP
// ****************************************

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