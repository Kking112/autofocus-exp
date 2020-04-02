import readlineSync from "readline-sync";

import { conductFocus } from "./focus";
import { greetUser } from "./main";
import {
  conductReviewsEpic,
  getReviewableList,
  readyToReview,
  setupReview
} from "./review";
import { constructNewTodoItem, ITodoItem, TodoState } from "./todoItem";
import {
  addTodoToList,
  firstReady,
  makePrintableTodoItemList,
  numListToTodoList,
  undotAll,
  itemExists,
  getLastMarked,
  getCMWTD
} from "./todoList";
import { getPluralS, isEmpty } from "./util";

// ****************************************
// PROMPTS
// ****************************************

const newItemTitlePrompt = `Enter todo item name \
(ie. wash the dishes). Enter 'Q' to quit: `;
//// 113. const newItemBodyPrompt = "Give your todo item a comment (ie. use \
//// dishwasher for non-glass items) or hit ENTER key to skip: ";
const menuPrompt = "Please choose from the menu above:";

enum MainMenuChoice {
  AddNew = "Add New Todo",
  ReviewTodos = "Review & Dot Todos",
  EnterFocus = "Enter Focus Mode",
  PrintList = "Print Todo List",
  ClearDots = "Clear Dots",
  ReadAbout = "Read About AutoFocus",
  Quit = "Quit Program"
}

const menuChoices: MainMenuChoice[] = [
  MainMenuChoice.AddNew,
  MainMenuChoice.ReviewTodos,
  MainMenuChoice.EnterFocus,
  MainMenuChoice.PrintList,
  MainMenuChoice.ClearDots,
  MainMenuChoice.ReadAbout,
  MainMenuChoice.Quit
];

export const promptUserWithMainMenu = (): MainMenuChoice => {
  return menuChoices[
    readlineSync.keyInSelect(menuChoices, menuPrompt, { cancel: false })
  ];
};

export const promptUserForYNQ = (questionString: string): string => {
  return readlineSync
    .question(questionString, { limit: ["y", "n", "q", "Y", "N", "Q"] })
    .toLowerCase();
};

// issue: Architect reviews for opportunity to make DRY, SOLID #299
export const promptUserForNewTodoItemCLI = (): ITodoItem | null => {
  const headerText = readlineSync.question(newItemTitlePrompt, {
    limit: /\w+/i,
    limitMessage: "Sorry, $<lastInput> is not a valid todo item title"
  }); // prevent empty input
  //// 113. let bodyText = "";
  if (headerText.toLowerCase() === "q") {
    return null;
  } else {
    //// 113. bodyText = readlineSync.question(newItemBodyPrompt);
    // issue: Dev implements momentjs datetime #103
    // issue: Dev implements ITodoItem uuid #104
    const newItem: ITodoItem = constructNewTodoItem(headerText, ""); //// 113. bodyText

    generalPrint(`New todo item '${newItem.header}' successfully created!`);

    return newItem;
  }
};

export const waitForKeyPress = () => {
  readlineSync.keyInPause(); // issue: Dev fixes ENTER key not quitting/ending focus mode #217
};

// ****************************************
// PRINT FUNCTIONS
// ****************************************

export const generalPrint = (s: string): void => {
  // tslint:disable-next-line:no-console
  console.log(s);
};

export const printTodoItemCount = (list: ITodoItem[]): void => {
  generalPrint(`You have ${list.length} todo item${getPluralS(list.length)}.`);
};

const printTodoItemList = (list: ITodoItem[]): void => {
  generalPrint(makePrintableTodoItemList(list));
};

// issue: Architect reviews for opportunity to make DRY, SOLID #299
export const printUpdate = (todoList: ITodoItem[]): void => {
  if (!itemExists(todoList, "state", TodoState.Marked)) {
    generalPrint(`Your CMWTD is currently set to nothing.`);
  } else {
    generalPrint(`Your CMWTD is '${getLastMarked(todoList)}'.`);
  }

  if (isEmpty(todoList)) {
    generalPrint("Your current Todo List is empty.");
  } else {
    generalPrint("Your current Todo List:");
    printTodoItemList(todoList);
  }
};

// ****************************************
// REVIEWING
// ****************************************

// issue: Dev fixes bug where review question count & content are correct #344
export const getReviewAnswersEpicCLI = (
  todoList: ITodoItem[],
  lastDone: string
): string[] => {
  const reviewableList = getReviewableList(todoList, lastDone);
  if (!isEmpty(reviewableList)) {
    // console.log('Getting numbered list...');
    return getReviewAnswersCLI(numListToTodoList(reviewableList));
  } else {
    // issue: Dev inspects getReviewAnswersEpicCLI for empty string result #294
    // console.log('Getting NON-numbered list...');
    return getReviewAnswersCLI(todoList);
  }
};

export const getAnswer = (x: string, y: string) => {
  return promptUserForYNQ(`Do you want to '${x}' more than '${y}'? (Y/N/Q) `);
};

// issue: Architect reviews for opportunity to make DRY, SOLID #299
// issue: Dev refactors getReviewAnswersCLI #216 // todo: modify issue #216 to use FP approach
export const getReviewAnswersCLI = (todoList: ITodoItem[]): string[] => {
  const answers: string[] = [];
  for (const x of todoList) {
    const ans = getAnswer(x.header, getCMWTD(todoList));
    if (ans === "y") {
      answers.push("y");
    }
    if (ans === "n") {
      answers.push("n");
    }
    if (ans === "q") {
      answers.push("q");
      break;
    }
  }
  return answers;
};

// issue: Dev refactors printReviewSetupMessage to be atomic #273
const printReviewSetupMessage = (todoList: ITodoItem[]): void => {
  if (isEmpty(todoList)) {
    generalPrint(
      "There are no items to review. Please enter mores items and try again."
    );
  } else if (firstReady(todoList) === -1) {
    generalPrint(
      "There are no items left to dot. Please enter more items and try again."
    );
  } else {
    generalPrint("Marking the first ready item...");
  }
};

// issue: Architect reviews for opportunity to make DRY, SOLID #299
const attemptReviewTodosCLI = (
  todoList: ITodoItem[],
  lastDone: string
): any => {
  printReviewSetupMessage(todoList);
  if (isEmpty(todoList)) {
    return todoList;
  }

  //if (todoList.map(x => x.state).indexOf(TodoState.Marked) === -1) {
  todoList = setupReview(todoList);
  //}

  // step 0: check to see if there are any non-complete, non-archived items
  if (readyToReview(todoList)) {
    // issue: Dev handles for list review when there are 2 or less items #107
    // issue: Architect designs option to always quit mid-menu #109
    // issue: Dev implements E2E test for CLA #110
    // issue: Dev implements todo item store using redux pattern #106
    const answers = getReviewAnswersEpicCLI(todoList, lastDone);
    todoList = conductReviewsEpic(todoList, lastDone, answers);
    printUpdate(todoList);
  }
  return todoList;
};

// ****************************************
// FOCUS MODE
// ****************************************

// issue: Architect reviews for opportunity to make DRY, SOLID #299
const enterFocusCLI = (todoList: ITodoItem[], lastDone: string): any => {
  // 0. confirm that focusMode can be safely entered
  if (isEmpty(todoList)) {
    generalPrint(
      "There are no todo items. Please enter todo items and try again."
    );
    return [todoList, lastDone];
  }
  if (!itemExists(todoList, "state", TodoState.Marked)) {
    generalPrint(
      "There is no 'current most want to do' item. Please review your items and try again."
    );
    return [todoList, lastDone];
  }

  // 1. clear the console view
  // tslint:disable-next-line:no-console
  console.clear();

  // 2. show the current todo item
  generalPrint(`You are working on '${getCMWTD(todoList)}'`);

  // 3. wait for any key to continue
  waitForKeyPress();

  // 4. ask the user if they have work left to do on current item
  // If there is work left to do on the cmwtd item, a duplicate issue is created.
  const response: any = { workLeft: "n" }; // initialize default "no" workLeft response
  if (promptUserForYNQ(`Do you have work left to do on this item?`) === "y") {
    response.workLeft = "y";
  }

  // 5. mark the cmwtd item as done
  [todoList, lastDone] = conductFocus(todoList, lastDone, response);

  return [todoList, lastDone];
};

const addNewCLI = (todoList: ITodoItem[]): any => {
  const temp: ITodoItem | null = promptUserForNewTodoItemCLI();
  if (temp !== null) {
    todoList = addTodoToList(todoList, temp);
    // issue: Dev implements todo item store using redux pattern #106
  }

  return todoList;
};

// ****************************************
// MAIN PROGRAM LOOP
// ****************************************

// issue: Architect reviews for opportunity to make DRY, SOLID #299
const menuActions: any = {
  [MainMenuChoice.AddNew]: (todoList: ITodoItem[], lastDone: string): any => {
    todoList = addNewCLI(todoList);
    printTodoItemCount(todoList);
    return [todoList, lastDone, true];
  },
  [MainMenuChoice.ReviewTodos]: (
    todoList: ITodoItem[],
    lastDone: string
  ): any => {
    todoList = attemptReviewTodosCLI(todoList, lastDone);
    return [todoList, lastDone, true];
  },
  [MainMenuChoice.EnterFocus]: (
    todoList: ITodoItem[],
    lastDone: string
  ): any => {
    [todoList, lastDone] = enterFocusCLI(todoList, lastDone);
    return [todoList, lastDone, true];
  },
  [MainMenuChoice.PrintList]: (
    todoList: ITodoItem[],
    lastDone: string
  ): any => {
    printUpdate(todoList);
    return [todoList, lastDone, true];
  },
  [MainMenuChoice.ClearDots]: (
    todoList: ITodoItem[],
    lastDone: string
  ): any => {
    generalPrint("Removing dots from dotted items...");
    generalPrint("Resetting the CMWTD...");
    return [undotAll(todoList), lastDone, true];
  },
  [MainMenuChoice.ReadAbout]: (
    todoList: ITodoItem[],
    lastDone: string
  ): any => {
    // issue: Dev adds about section text print out #128
    generalPrint("This is stub (placeholder) text. Please check back later.");
    return [todoList, lastDone, true];
  },
  [MainMenuChoice.Quit]: (todoList: ITodoItem[], lastDone: string): any => {
    return [todoList, lastDone, false];
  }
};

export const mainCLI = (): void => {
  generalPrint(greetUser());

  // initialize program variables
  let todoList: ITodoItem[] = [];
  let lastDone: string = "";

  // start main program loop
  let running = true;
  while (running) {
    const answer = promptUserWithMainMenu();
    [todoList, lastDone, running] = menuActions[answer](todoList, lastDone);
  }

  generalPrint("Have a nice day!");
};

const sampleOutput: string = `Welcome to AutoFocus!

[1] Add New Todo
[2] Review & Dot Todos
[3] Enter Focus Mode
[4] Print Todo List
[5] Clear Dots
[6] Read About AutoFocus
[7] Quit Program

Please choose from the menu above [1...7]: 1
Enter todo item name (ie. wash the dishes).
Enter 'Q' to quit: Make cup of coffee
New todo item 'Make cup of coffee' created!
Your list now has 1 todo item.
`;

export const printSampleOutput = () => {
  generalPrint(sampleOutput);
};
