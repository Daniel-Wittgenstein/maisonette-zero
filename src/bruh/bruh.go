
package main

import (
	"encoding/json"
	"fmt"
	"flag"
	"os"
)

/* parameters:

- input file
- output file
- prefix -- for example "abc = " or "add_data("
- postfix -- for example "" or ")"
- metadata string (for example: "filename.txt")

bruh -input=story.jnx -output=story.js -prefix="load_data(" -postfix=")" -meta="a string containing anything"

go run . -input=story.jnx -output=story.js -prefix="load_data(" postfix=")" -meta="a string containing anything"

*/

func main() {

	inputPtr := flag.String("input", "./story.jnx", "Name of the input file.")
	outputPtr := flag.String("output", "./story.js", "Name of the output file.")
	prefixPtr := flag.String("prefix", "abc = ", "Prefix text.")
	postfixPtr := flag.String("postfix", "", "Postfix text.")
	metaPtr := flag.String("meta", "some meta data", "Meta data string.")
	helpPtr := flag.Bool("help", false, "Get advanced help. Just run:    bruh -help")

	flag.Parse()
	
	if *helpPtr {
		displayHelp()
		return
	}
  
	fmt.Println("Bruh Text Processor v0.1 --- To get help, run:   bruh -help   \n")
	
	/*
	fmt.Println("input:", *inputPtr)
	fmt.Println("output:", *outputPtr)
	fmt.Println("prefix:", *prefixPtr)
	fmt.Println("postfix:", *postfixPtr)
	fmt.Println("meta:", *metaPtr)
	
	fmt.Println("help:", *helpPtr)
	
	fmt.Println("tail:", flag.Args())
	*/
	fmt.Println(*inputPtr + " -> " + *outputPtr)

  dat, err := os.ReadFile(*inputPtr)
  
	if err != nil {
		fmt.Println("ERROR: Could not read file: " + *inputPtr)
		return
	}

	fileContents := string(dat)

  //fmt.Print(fileContents)

	type thingy struct {
		Contents string
		Meta string
	}

	bla := &thingy{
        Contents: fileContents,
        Meta: *metaPtr}

	res, _ := json.Marshal(bla)

	jsonContents := *prefixPtr + string(res) + *postfixPtr

	//fmt.Print("\n"+jsonContents)

	err = os.WriteFile(*outputPtr, []byte(jsonContents), 0777)
	if err != nil {
		fmt.Print("ERROR: Could not write file " + *outputPtr + "\n")
		return
	}

	fmt.Print("Success!\n")
	fmt.Print("\n")
	
}

func displayHelp() {
	fmt.Println("##### Bruh Help #####\n\n"+
	"Display this help text:\n" +
	"    bruh -help\n\n"+
	"Usage:\n" +
	"    bruh -input=story.jnx -output=story.js -prefix=\"load_data(\" -postfix=\")\" " +
	"-meta=\"a string containing anything\"\n\n" +
	"Note: don't use whitespace before or after =\n" +
	"Note: already existing output file IS OVERWRITTEN WITHOUT A WARNING")
}




