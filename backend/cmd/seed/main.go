package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type category struct {
	name        string
	slug        string
	description string
	pillar      string
}

var categories = []category{
	{"HTML / CSS", "html-css", "Mise en page, flexbox, grid, animations et bonnes pratiques du web.", "dev"},
	{"JavaScript", "javascript", "Vanilla JS, ES2024+, async/await, manipulation du DOM et écosystème npm.", "dev"},
	{"React", "react", "Composants, hooks, state management, TanStack, Zustand et patterns modernes.", "dev"},
	{"Golang", "golang", "Goroutines, APIs REST, gestion des erreurs, interfaces et patterns Go.", "dev"},
	{"PHP", "php", "PHP moderne, Laravel, Symfony, Composer et architecture back-end.", "dev"},
	{"Bases de données", "databases", "SQL, PostgreSQL, MySQL, MongoDB, ORM et optimisation des requêtes.", "dev"},
	{"Cybersécurité", "security", "OWASP, authentification, JWT, chiffrement, pentesting et bonnes pratiques.", "dev"},
	{"TypeScript", "typescript", "Typage statique, generics, utility types, config tsconfig et intégration avec React.", "dev"},
	{"Python", "python", "Scripts, data science, Django/FastAPI, asyncio, packaging et bonnes pratiques.", "dev"},
	{"DevOps / CI-CD", "devops", "Docker, GitHub Actions, Kubernetes, déploiement continu et infrastructure as code.", "dev"},
	{"IA & LLM", "ai-llm", "Intégration LLM, prompt engineering, RAG, fine-tuning et outils IA pour développeurs.", "dev"},
	{"Mobile", "mobile", "React Native, Expo, Flutter, Swift, Kotlin et publication sur les stores.", "dev"},
	{"Entraide générale", "general", "Bloqué sur un bug ? Pose ta question ici, la communauté répond.", "community"},
	{"Ressources", "resources", "Liens utiles, tutoriels, outils, librairies et veille technologique.", "community"},
	{"Projets étudiants", "projects", "Présentez vos projets, demandez des retours et trouvez des collaborateurs.", "community"},
	{"Carrière & Emploi", "career", "CV, entretiens techniques, alternance, freelance et évolution de carrière en tech.", "community"},
}

func main() {
	dsn := "postgresql://neondb_owner:npg_FbqV4iOpJ0Nl@ep-rough-bread-al3uc6kl-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if len(os.Args) < 1 {
		printUsage()
		return
	}

	cmd := ""
	if len(os.Args) > 1 {
		cmd = os.Args[1]
	}

	switch cmd {
	case "admin":
		if len(os.Args) < 3 {
			fmt.Println("Usage: go run ./cmd/seed admin email@example.com")
			return
		}
		email := os.Args[2]
		res, err := db.Exec("UPDATE users SET role = 'admin' WHERE email = $1", email)
		if err != nil {
			log.Fatal(err)
		}
		n, _ := res.RowsAffected()
		if n == 0 {
			fmt.Printf("Aucun utilisateur trouvé avec l'email: %s\n", email)
		} else {
			fmt.Printf("✓ Rôle admin attribué à %s\n", email)
		}

	case "alter":
		// Convertit posts.content de jsonb → text (nécessaire pour stocker du HTML TipTap)
		_, err := db.Exec(`ALTER TABLE posts ALTER COLUMN content TYPE text USING content::text`)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Println("✓ posts.content converti en text")

	case "categories":
		inserted := 0
		for _, c := range categories {
			_, err := db.Exec(
				`INSERT INTO categories (name, slug, description, pillar)
				 VALUES ($1, $2, $3, $4)
				 ON CONFLICT (slug) DO NOTHING`,
				c.name, c.slug, c.description, c.pillar,
			)
			if err != nil {
				fmt.Printf("✗ %s : %v\n", c.name, err)
				continue
			}
			inserted++
			fmt.Printf("✓ %s\n", c.name)
		}
		fmt.Printf("\n%d catégorie(s) insérée(s).\n", inserted)

	default:
		// Liste les utilisateurs
		rows, err := db.Query("SELECT username, email, role FROM users ORDER BY created_at")
		if err != nil {
			log.Fatal(err)
		}
		defer rows.Close()
		fmt.Println("USERNAME             EMAIL                          ROLE")
		fmt.Println("------------------------------------------------------------")
		for rows.Next() {
			var u, e, r string
			rows.Scan(&u, &e, &r)
			fmt.Printf("%-20s %-30s %s\n", u, e, r)
		}
	}
}

func printUsage() {
	fmt.Println("Usage:")
	fmt.Println("  go run ./cmd/seed                         — lister les utilisateurs")
	fmt.Println("  go run ./cmd/seed admin email@example.com — passer admin")
	fmt.Println("  go run ./cmd/seed categories              — insérer les catégories")
	fmt.Println("  go run ./cmd/seed alter                   — convertir posts.content en text")
}
