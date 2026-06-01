package calculator

import (
	"context"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"math"
	"strconv"
	"strings"

	"github.com/frostz/lucy/internal/tools"
)

type Tool struct{}

func New() *Tool {
	return &Tool{}
}

func (t *Tool) Name() string {
	return "calculator"
}

func (t *Tool) Description() string {
	return "Evaluate mathematical expressions. Supports addition, subtraction, multiplication, division, exponents, and parentheses."
}

func (t *Tool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"expression": map[string]interface{}{
			"type":        "string",
			"description": "The mathematical expression to evaluate (e.g., '2 + 2', '3 * 4', '2^10')",
		},
	}
}

func (t *Tool) Execute(ctx context.Context, params tools.Params) (string, error) {
	expr, ok := params["expression"].(string)
	if !ok || strings.TrimSpace(expr) == "" {
		return "", fmt.Errorf("expression is required")
	}

	// Replace ^ with ** for Go parser
	expr = strings.ReplaceAll(expr, "^", "**")

	result, err := eval(expr)
	if err != nil {
		return "", fmt.Errorf("failed to evaluate: %w", err)
	}

	return fmt.Sprintf("%s = %v", params["expression"], result), nil
}

func eval(expr string) (float64, error) {
	expr = strings.TrimSpace(expr)

	// Try integer first
	if val, err := strconv.ParseInt(expr, 10, 64); err == nil {
		return float64(val), nil
	}

	// Try float
	if val, err := strconv.ParseFloat(expr, 64); err == nil {
		return val, nil
	}

	// Parse as Go expression
	node, err := parser.ParseExpr(expr)
	if err != nil {
		// Try wrapping in parentheses
		node, err = parser.ParseExpr("(" + expr + ")")
		if err != nil {
			// Try as binary expression
			node, err = parser.ParseExpr(expr)
			if err != nil {
				return 0, fmt.Errorf("invalid expression: %s", expr)
			}
		}
	}

	return evalNode(node)
}

func evalNode(node ast.Node) (float64, error) {
	switch n := node.(type) {
	case *ast.BinaryExpr:
		return evalBinaryExpr(n)
	case *ast.ParenExpr:
		return evalNode(n.X)
	case *ast.UnaryExpr:
		return evalUnaryExpr(n)
	case *ast.Ident:
		switch n.Name {
		case "pi":
			return math.Pi, nil
		case "e":
			return math.E, nil
		default:
			return 0, fmt.Errorf("unknown identifier: %s", n.Name)
		}
	case *ast.BasicLit:
		return strconv.ParseFloat(n.Value, 64)
	case *ast.CallExpr:
		return evalCallExpr(n)
	default:
		return 0, fmt.Errorf("unsupported expression type: %T", node)
	}
}

func evalBinaryExpr(n *ast.BinaryExpr) (float64, error) {
	x, err := evalNode(n.X)
	if err != nil {
		return 0, err
	}
	y, err := evalNode(n.Y)
	if err != nil {
		return 0, err
	}

	switch n.Op {
	case token.ADD:
		return x + y, nil
	case token.SUB:
		return x - y, nil
	case token.MUL:
		return x * y, nil
	case token.QUO:
		if y == 0 {
			return 0, fmt.Errorf("division by zero")
		}
		return x / y, nil
	case token.REM:
		return float64(int64(x) % int64(y)), nil
	default:
		return 0, fmt.Errorf("unsupported operator: %s", n.Op)
	}
}

func evalUnaryExpr(n *ast.UnaryExpr) (float64, error) {
	x, err := evalNode(n.X)
	if err != nil {
		return 0, err
	}
	switch n.Op {
	case token.SUB:
		return -x, nil
	case token.ADD:
		return x, nil
	default:
		return 0, fmt.Errorf("unsupported unary operator: %s", n.Op)
	}
}

func evalCallExpr(n *ast.CallExpr) (float64, error) {
	ident, ok := n.Fun.(*ast.Ident)
	if !ok {
		return 0, fmt.Errorf("unsupported function call")
	}

	args := make([]float64, len(n.Args))
	for i, arg := range n.Args {
		v, err := evalNode(arg)
		if err != nil {
			return 0, err
		}
		args[i] = v
	}

	switch ident.Name {
	case "sqrt":
		if len(args) != 1 {
			return 0, fmt.Errorf("sqrt requires 1 argument")
		}
		return math.Sqrt(args[0]), nil
	case "abs":
		if len(args) != 1 {
			return 0, fmt.Errorf("abs requires 1 argument")
		}
		return math.Abs(args[0]), nil
	case "sin":
		if len(args) != 1 {
			return 0, fmt.Errorf("sin requires 1 argument")
		}
		return math.Sin(args[0]), nil
	case "cos":
		if len(args) != 1 {
			return 0, fmt.Errorf("cos requires 1 argument")
		}
		return math.Cos(args[0]), nil
	case "tan":
		if len(args) != 1 {
			return 0, fmt.Errorf("tan requires 1 argument")
		}
		return math.Tan(args[0]), nil
	case "log":
		if len(args) != 1 {
			return 0, fmt.Errorf("log requires 1 argument")
		}
		return math.Log(args[0]), nil
	case "pow":
		if len(args) != 2 {
			return 0, fmt.Errorf("pow requires 2 arguments")
		}
		return math.Pow(args[0], args[1]), nil
	case "round":
		if len(args) != 1 {
			return 0, fmt.Errorf("round requires 1 argument")
		}
		return math.Round(args[0]), nil
	case "floor":
		if len(args) != 1 {
			return 0, fmt.Errorf("floor requires 1 argument")
		}
		return math.Floor(args[0]), nil
	case "ceil":
		if len(args) != 1 {
			return 0, fmt.Errorf("ceil requires 1 argument")
		}
		return math.Ceil(args[0]), nil
	default:
		return 0, fmt.Errorf("unknown function: %s", ident.Name)
	}
}
